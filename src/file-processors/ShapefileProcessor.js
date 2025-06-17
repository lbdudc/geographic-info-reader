import { FileProcessor } from "./FileProcessor.js";
import shapefile from "shapefile";
import { unzipFile, zipFilesGroupByShapefile } from "../utils/zipUtils.js";
import path from "path";
import { customCopyFile, getAbsolutePath } from "../utils/utils.js";
import { SHP_EXTS, ZIP_EXT } from "../utils/file-extensions.js";
import { readdirSync } from "fs";

export class ShapefileProcessor extends FileProcessor {
  async open(filePath, encoding, options) {
    let shpPath = filePath;

    const outCalc = !options.outputPath
      ? `${path.dirname(filePath)}${path.sep}output`
      : `${options.outputPath}${path.sep}output`;
    const outputPathAbsolute = getAbsolutePath(outCalc);
    // Decompress ZIP file
    if (filePath.endsWith(ZIP_EXT)) {
      const extractedFilePaths = await unzipFile(filePath, outputPathAbsolute);
      // Process .shp file
      shpPath = extractedFilePaths.find((file) => file.endsWith(".shp"));
    } else await this.copyNecessaryFiles(shpPath, outputPathAbsolute);

    const fileData = {};
    // Retrieve the geographic information from .shp file
    fileData.source = await shapefile.open(shpPath, undefined, {
      encoding: encoding,
    });

    // Retrieve the data from .dbf file
    const dbfFilePath = shpPath.replace(".shp", ".dbf");
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

  getFileType() {
    return "shapefile";
  }

  async writeFileToOutput(filePath, outputPath) {
    const outCalc = !outputPath
      ? `${path.dirname(filePath)}${path.sep}output`
      : `${outputPath}${path.sep}output`;
    const outputPathAbsolute = getAbsolutePath(outCalc);
    const fileName = path.parse(filePath).name;
    await zipFilesGroupByShapefile(outputPathAbsolute, fileName);
  }

  async copyNecessaryFiles(shpPath, outputPath) {
    const baseName = path.basename(shpPath, path.extname(shpPath));
    const inputPath = path.dirname(shpPath);
    const files = readdirSync(inputPath);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const name = path.basename(file, ext);
      const isValidExt = SHP_EXTS.includes(ext);

      if (name === baseName && isValidExt) {
        await customCopyFile(
          path.join(inputPath, file),
          path.join(outputPath, file),
        );
      }
    }
  }
}
