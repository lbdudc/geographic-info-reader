import { FileProcessor } from "./FileProcessor.js";
import shapefile from "shapefile";
import { unzipFile } from "../utils/zipUtils.js";
import path from "path";
import { detectEncoding, getAbsolutePath } from "../utils/utils.js";
import fs from "fs";
import log from "../utils/log.js";

export class ShapefileProcessor extends FileProcessor {
  async process(filePath, options) {
    // Decompress the file
    if (filePath.endsWith(".zip")) {
      const outCalc = !options.outputPath
        ? `${path.dirname(filePath)}${path.sep}output`
        : `${options.outputPath}${path.sep}output`;
      const outputPathAbsolute = getAbsolutePath(outCalc);

      const extractedFilePaths = await unzipFile(filePath, outputPathAbsolute);

      // Process .shp file
      const shpPath = extractedFilePaths.find((file) => file.endsWith(".shp"));
      const shpName = path.basename(shpPath);

      // Detect file encoding
      const encoding =
        options.encoding === "auto"
          ? detectEncoding(shpPath)
          : options.encoding;

      log(`Processing ${filePath} with encoding ${encoding}`);

      const fileData = await this.open(shpPath, encoding);

      const schemaFields = await this.getSchemaFields(fileData);

      const sldFilePath = shpPath.replace(/\.[^/.]+$/, ".sld");
      let hasSld = false;
      if (fs.existsSync(sldFilePath)) {
        hasSld = true;
      }

      let res = {
        name: shpName.split(".")[0],
        fileName: shpName,
        hasSld: hasSld,
        schema: schemaFields,
      };

      if (options.geographicInfo) {
        res.geographicInfo = await this.getGeographicInfo(fileData);
      }

      return res;
    }
  }

  async open(filePath, encoding) {
    const fileData = {};
    // Retrieve the geographic information from .shp file
    fileData.source = await shapefile.open(filePath, undefined, {
      encoding: encoding,
    });

    // Retrieve the data from .dbf file
    const dbfFilePath = filePath.replace(".shp", ".dbf");
    fileData.dbfData = await shapefile.openDbf(dbfFilePath);
    return fileData;
  }

  async getSchemaFields(fileData) {
    const source = fileData.source;
    const geojson = await source.read();
    const geographicInfo = JSON.stringify(geojson);

    const dbfData = fileData.dbfData;

    // Retrieve the schema from .dbf file
    let schemaFields = dbfData._fields
      .filter(
        (field, index, self) =>
          index ===
          self.findIndex((t) => t.name === field.name && t.type === field.type),
      )
      .map((field) => {
        return {
          name: field.name,
          type: field.type === "N" ? "Number" : "String",
          length: field.length,
        };
      });

    const TYPES = {
      Point: "Point",
      MultiPoint: "MultiPoint",
      Polygon: "MultiPolygon",
      MultiPolygon: "MultiPolygon",
      LineString: "MultiLineString",
      MultiLineString: "MultiLineString",
    };

    // Add the geographic field to the schema
    schemaFields.push({
      name: "geometry",
      type:
        TYPES[JSON.parse(geographicInfo).value?.geometry?.type] || "Geometry",
    });

    return schemaFields;
  }

  async getGeographicInfo(fileData) {
    // Retrieve the geographic information from .shp file
    return await fileData.source.read();
  }

  shouldZip() {
    return true;
  }
}
