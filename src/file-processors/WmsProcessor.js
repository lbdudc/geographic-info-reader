import { FileProcessor } from "./FileProcessor.js";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { customCopyFile, getAbsolutePath } from "../utils/utils.js";
import { parseStringPromise } from "xml2js";

export class WmsProcessor extends FileProcessor {
  async open(filePath) {
    const content = readFileSync(filePath, "utf8");
    const urls = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    // A "<filePath>.json" sidecar, when present, scopes each service down to the
    // specific sublayer(s) actually picked instead of publishing everything the
    // service advertises (see qgispublisher-plugin's gispublisher_runner.py, which
    // writes it alongside urls.wms). Its absence — an older plugin, or a urls.wms
    // authored by hand — falls back to today's whole-service behavior unchanged, so
    // this stays backward compatible in both directions.
    let requestsByUrl = null;
    const sidecarPath = `${filePath}.json`;
    if (existsSync(sidecarPath)) {
      try {
        const requests = JSON.parse(readFileSync(sidecarPath, "utf8"));
        requestsByUrl = new Map();
        for (const request of requests) {
          if (!request?.url) continue;
          const existing = requestsByUrl.get(request.url) || [];
          existing.push(request);
          requestsByUrl.set(request.url, existing);
        }
      } catch (error) {
        console.warn(
          `Ignoring invalid WMS scoping sidecar (${sidecarPath}): ${error.message}`,
        );
      }
    }

    return { urls, requestsByUrl };
  }

  async getSchemaFields({ urls, requestsByUrl }) {
    const allLayersInfo = [];

    for (const url of urls) {
      // Multiple QGIS layers can point at the same service with different
      // sublayer/style/crs/format picks — each becomes its own request object, all
      // scoping the one fetch below.
      const requests = requestsByUrl?.get(url) || null;

      try {
        const capabilitiesUrl = this._ensureCapabilitiesUrl(url);
        const response = await fetch(capabilitiesUrl);
        const xmlText = await response.text();
        const json = await parseStringPromise(xmlText);

        const version = this._extractVersion(json);
        const formats = this._extractFormats(json);
        let layers = this._extractLayers(json);

        const requestedNames = requests
          ? new Set(requests.flatMap((r) => r.layers || []))
          : null;
        if (requestedNames && requestedNames.size > 0) {
          layers = layers.filter((l) => requestedNames.has(l.Name?.[0]));
        }

        for (const layer of layers) {
          if (!layer.Name?.[0]) continue;

          const layerName = layer.Name[0];
          // Whichever request named this layer — first match wins if more than one
          // request somehow claims the same sublayer.
          const request =
            requests?.find((r) => (r.layers || []).includes(layerName)) || null;

          const completeTitle = layer.Title?.[0] || layerName;
          const preferredFormats = ["png", "jpeg", "jpg"];
          const autoFormat =
            formats.find((f) =>
              preferredFormats.some((pf) => f.includes(pf)),
            ) ||
            formats[0] ||
            null;
          const crsList = (layer.BoundingBox || [])
            .map((b) => b.$.CRS || b.$.SRS)
            .filter(Boolean);
          const autoStyles = (layer.Style || []).map(
            (s) => s.Name?.[0] || "default",
          );
          const allBBoxes = this._extractBoundingBox(layer);

          allLayersInfo.push({
            url: url,
            layerName: layerName,
            layerTitle: this._cleanLayerTitle(completeTitle),
            format: request?.format || autoFormat,
            crs: request?.crs
              ? [request.crs]
              : crsList.length > 0
                ? crsList
                : null,
            styles: request?.styles?.length ? request.styles : autoStyles,
            queryable: layer.$?.queryable === "1" || false,
            attribution:
              layer.Attribution?.[0]?.Title?.[0] ||
              layer.Attribution?.[0]?.OnlineResource?.[0]?.["$"]?.[
                "xlink:href"
              ] ||
              null,
            version,
            bbox: this._getPreferredBoundingBox(allBBoxes),
            external: true,
          });
        }
      } catch (error) {
        console.warn(`Error processing WMS (${url}): ${error.message}`);
        allLayersInfo.push({
          url,
          error: error.message,
          external: true,
        });
      }
    }

    return allLayersInfo;
  }

  async getGeographicInfo(fileData) {
    return await this.getSchemaFields(fileData);
  }

  getFileType() {
    return "wms";
  }

  async writeFileToOutput(filePath, outputPath) {
    const outCalc = outputPath
      ? path.join(outputPath, "output")
      : path.join(path.dirname(filePath), "output");

    const outputPathAbsolute = getAbsolutePath(outCalc);
    const fileName = path.basename(filePath);
    const fileOutputPath = path.join(outputPathAbsolute, fileName);

    await customCopyFile(filePath, fileOutputPath);
  }

  _ensureCapabilitiesUrl(url) {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      if (!params.has("service")) params.set("service", "WMS");
      if (!params.has("request")) params.set("request", "GetCapabilities");

      return urlObj.toString();
    } catch (e) {
      console.warn(`Invalid URL: ${url}`);
      return null;
    }
  }

  _getCapabilityRoot(json) {
    return (
      json.WMS_Capabilities?.Capability?.[0] ||
      json.WMT_MS_Capabilities?.Capability?.[0] ||
      null
    );
  }

  _extractVersion(json) {
    return (
      json.WMS_Capabilities?.$?.version ||
      json.WMT_MS_Capabilities?.$?.version ||
      "1.3.0"
    );
  }

  _extractFormats(json) {
    const capability = this._getCapabilityRoot(json);
    return capability?.Request?.[0]?.GetMap?.[0]?.Format || [];
  }

  _extractLayers(json) {
    const rootLayer = this._getCapabilityRoot(json)?.Layer?.[0];
    if (!rootLayer) return [];
    const all = this._flattenLayers(rootLayer);
    return all.filter((l) => l.Name);
  }

  _flattenLayers(layer) {
    let layers = [];
    if (layer.Layer) {
      for (const subLayer of layer.Layer) {
        layers = layers.concat(this._flattenLayers(subLayer));
      }
    }
    if (layer.Name) layers.push(layer);
    return layers;
  }

  _extractBoundingBox(layer) {
    const boundingBoxes = [];

    // 1. Standard BoundingBox elements (WMS 1.1.1 and 1.3.0)
    const layerBBoxes = layer.BoundingBox || [];

    for (const bbox of layerBBoxes) {
      const attributes = bbox["$"];

      if (attributes) {
        boundingBoxes.push({
          crs: attributes.SRS || attributes.CRS, // WMS 1.1.1 uses SRS, 1.3.0 uses CRS
          minx: parseFloat(attributes.minx),
          miny: parseFloat(attributes.miny),
          maxx: parseFloat(attributes.maxx),
          maxy: parseFloat(attributes.maxy),
          isCRS_Specific: true,
        });
      }
    }

    // 2. LatLonBoundingBox (WMS 1.1.1)
    // Always defined in WGS84 coordinates (EPSG:4326)
    const latLonBBox = layer.LatLonBoundingBox?.[0]?.$;

    if (latLonBBox) {
      boundingBoxes.push({
        crs: "EPSG:4326",
        minx: parseFloat(latLonBBox.minx),
        miny: parseFloat(latLonBBox.miny),
        maxx: parseFloat(latLonBBox.maxx),
        maxy: parseFloat(latLonBBox.maxy),
        isGlobal: true,
      });
    }

    // 3. EX_GeographicBoundingBox (WMS 1.3.0)
    const exGeographicBBox = layer.EX_GeographicBoundingBox?.[0];

    if (
      exGeographicBBox &&
      exGeographicBBox.westBoundLongitude &&
      exGeographicBBox.eastBoundLongitude
    ) {
      boundingBoxes.push({
        crs: "EPSG:4326",
        minx: parseFloat(exGeographicBBox.westBoundLongitude?.[0]),
        miny: parseFloat(exGeographicBBox.southBoundLatitude?.[0]),
        maxx: parseFloat(exGeographicBBox.eastBoundLongitude?.[0]),
        maxy: parseFloat(exGeographicBBox.northBoundLatitude?.[0]),
        isGlobal: true,
      });
    }

    return boundingBoxes;
  }

  _getPreferredBoundingBox(boundingBoxes) {
    if (!boundingBoxes || boundingBoxes.length === 0) return null;

    const preferredBBox = boundingBoxes.find(
      (bbox) =>
        bbox.crs?.toUpperCase() === "EPSG:4326" ||
        bbox.crs?.toUpperCase() === "CRS:84",
    );
    if (preferredBBox) return preferredBBox;

    const webMercatorBBox = boundingBoxes.find(
      (bbox) => bbox.crs?.toUpperCase() === "EPSG:3857",
    );
    if (webMercatorBBox) return webMercatorBBox;

    return boundingBoxes[0];
  }

  _cleanLayerTitle(text) {
    if (!text) return;
    let cleaned = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    return cleaned;
  }
}
