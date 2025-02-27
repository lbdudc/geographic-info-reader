import { FileProcessor } from "./FileProcessor.js";
import shapefile from "shapefile";
import { unzipFile } from "../utils/zipUtils.js";
import path from "path";
import { getAbsolutePath } from "../utils/utils.js";

export class ShapefileProcessor extends FileProcessor {
  async open(filePath, encoding, options) {
    let shpPath = filePath;

    // Decompress ZIP file
    if (filePath.endsWith(".zip")) {
      const outCalc = !options.outputPath
        ? `${path.dirname(filePath)}${path.sep}output`
        : `${options.outputPath}${path.sep}output`;
      const outputPathAbsolute = getAbsolutePath(outCalc);

      const extractedFilePaths = await unzipFile(filePath, outputPathAbsolute);

      // Process .shp file
      shpPath = extractedFilePaths.find((file) => file.endsWith(".shp"));
    }

    const fileData = {};
    // Retrieve the geographic information from .shp file
    fileData.source = await shapefile.open(shpPath, undefined, {
      encoding: encoding,
    });

    // Retrieve the data from .dbf file
    const dbfFilePath = shpPath.replace(".shp", ".dbf");
    fileData.dbfData = await shapefile.openDbf(dbfFilePath);
    return [fileData, shpPath];
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

  getFileType() {
    return "shapefile";
  }

  shouldZip() {
    return true;
  }
}
