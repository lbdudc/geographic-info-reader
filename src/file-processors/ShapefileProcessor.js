import { FileProcessor } from "./FileProcessor";
import path from "path";
import log from "../utils/log.js";
import shapefile from "shapefile";
import fs from "fs";
import { detectEncoding } from "../utils/utils.js";

export class ShapefileProcessor extends FileProcessor {
  constructor() {
    super();
  }

  /**
   * Process the shapefile and generate a json object with the information of the shapefile
   * @param {String} filePath
   * @returns {Object} content with the information of the shapefile
   */
  async process(filePath, options) {
    // split the path to get the name of the file with "/"" or "\\"
    const fileName = filePath.split(path.sep).pop();

    // Detect the encoding of the shapefile
    const encoding =
      options.encoding === "auto" ? detectEncoding(filePath) : options.encoding;

    log(`Processing ${fileName} with encoding ${encoding}`);

    // Retrieve the geographic information from .shp file
    const source = await shapefile.open(filePath, undefined, {
      encoding: encoding,
    });
    const geojson = await source.read();
    const geographicInfo = JSON.stringify(geojson);

    // Retrieve if exists the .sld file
    const sldFilePath = filePath.replace(".shp", ".sld");
    let hasSld = false;
    if (fs.existsSync(sldFilePath)) {
      hasSld = true;
    }

    // Retrieve the data from .dbf file
    const dbfFilePath = filePath.replace(".shp", ".dbf");
    const dbfData = await shapefile.openDbf(dbfFilePath);

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

    let res = {
      name: fileName.split(".")[0],
      fileName: fileName,
      hasSld: hasSld,
      schema: schemaFields,
      geographicInfo: JSON.parse(geographicInfo),
    };

    // delete res keys if options.geographicInfo is false
    if (!options.geographicInfo) delete res.geographicInfo;

    return res;
  }
}
