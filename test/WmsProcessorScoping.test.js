import { test, describe, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { WmsProcessor } from "../src/file-processors/WmsProcessor.js";

// A minimal WMS 1.3.0 GetCapabilities response advertising three named layers —
// enough to exercise _flattenLayers/_extractLayers without depending on a live
// remote service (see Processor.test.js's "Process WMS URLs from file", which hits
// wms.mapama.gob.es directly and is flaky/unreachable from some environments).
const CAPABILITIES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
  <Service><Name>WMS</Name><Title>Test WMS</Title></Service>
  <Capability>
    <Request><GetMap><Format>image/png</Format><Format>image/jpeg</Format></GetMap></Request>
    <Layer>
      <Layer queryable="1">
        <Name>layer_a</Name>
        <Title>Layer A</Title>
        <Style><Name>default</Name><Title>Default</Title></Style>
        <BoundingBox CRS="EPSG:4326" minx="-10" miny="35" maxx="5" maxy="45"/>
      </Layer>
      <Layer queryable="0">
        <Name>layer_b</Name>
        <Title>Layer B</Title>
        <Style><Name>style_b</Name></Style>
        <BoundingBox CRS="EPSG:4326" minx="-10" miny="35" maxx="5" maxy="45"/>
      </Layer>
      <Layer>
        <Name>layer_c</Name>
        <Title>Layer C</Title>
        <BoundingBox CRS="EPSG:4326" minx="-10" miny="35" maxx="5" maxy="45"/>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

let server;
let baseUrl;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(CAPABILITIES_XML);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/wms`;
});

afterAll(() => {
  server.close();
});

const workDir = "./test/testData/wmsScopingWork";

describe("WmsProcessor scoping sidecar", () => {
  test("no sidecar publishes every layer the service advertises (unchanged behavior)", async () => {
    mkdirSync(workDir, { recursive: true });
    const filePath = `${workDir}/urls.wms`;
    writeFileSync(filePath, baseUrl, "utf8");

    const processor = new WmsProcessor();
    const fileData = await processor.open(filePath);
    const schema = await processor.getSchemaFields(fileData);

    expect(schema.map((l) => l.layerName).sort()).toEqual([
      "layer_a",
      "layer_b",
      "layer_c",
    ]);

    rmSync(workDir, { recursive: true, force: true });
  });

  test("a sidecar scopes the result to only the requested sublayer", async () => {
    mkdirSync(workDir, { recursive: true });
    const filePath = `${workDir}/urls.wms`;
    writeFileSync(filePath, baseUrl, "utf8");
    writeFileSync(
      `${filePath}.json`,
      JSON.stringify([
        {
          url: baseUrl,
          layers: ["layer_b"],
          styles: ["style_b"],
          crs: "EPSG:3857",
          format: "image/jpeg",
        },
      ]),
      "utf8",
    );

    const processor = new WmsProcessor();
    const fileData = await processor.open(filePath);
    const schema = await processor.getSchemaFields(fileData);

    expect(schema.length).toBe(1);
    expect(schema[0].layerName).toBe("layer_b");
    // The request's own crs/format/styles override what GetCapabilities advertised.
    expect(schema[0].crs).toEqual(["EPSG:3857"]);
    expect(schema[0].format).toBe("image/jpeg");
    expect(schema[0].styles).toEqual(["style_b"]);

    rmSync(workDir, { recursive: true, force: true });
  });

  test("a sidecar requesting multiple sublayers keeps only those", async () => {
    mkdirSync(workDir, { recursive: true });
    const filePath = `${workDir}/urls.wms`;
    writeFileSync(filePath, baseUrl, "utf8");
    writeFileSync(
      `${filePath}.json`,
      JSON.stringify([
        {
          url: baseUrl,
          layers: ["layer_a", "layer_c"],
          styles: [],
          crs: "",
          format: "",
        },
      ]),
      "utf8",
    );

    const processor = new WmsProcessor();
    const fileData = await processor.open(filePath);
    const schema = await processor.getSchemaFields(fileData);

    expect(schema.map((l) => l.layerName).sort()).toEqual([
      "layer_a",
      "layer_c",
    ]);
    // No override given for these -> falls back to the auto-detected style/crs/format.
    expect(schema.find((l) => l.layerName === "layer_a").styles).toEqual([
      "default",
    ]);

    rmSync(workDir, { recursive: true, force: true });
  });

  test("a malformed sidecar is ignored, falling back to whole-service behavior", async () => {
    mkdirSync(workDir, { recursive: true });
    const filePath = `${workDir}/urls.wms`;
    writeFileSync(filePath, baseUrl, "utf8");
    writeFileSync(`${filePath}.json`, "{not valid json", "utf8");

    const processor = new WmsProcessor();
    const fileData = await processor.open(filePath);
    const schema = await processor.getSchemaFields(fileData);

    expect(schema.length).toBe(3);

    rmSync(workDir, { recursive: true, force: true });
  });
});
