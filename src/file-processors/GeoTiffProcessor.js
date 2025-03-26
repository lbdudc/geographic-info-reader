import { FileProcessor } from "./FileProcessor.js";
import path from "path";
import { copyFile, getAbsolutePath } from "../utils/utils.js";

export class GeoTiffProcessor extends FileProcessor {
  async open() {
    return null;
  }

  async getSchemaFields() {
    return [];
  }

  async getGeographicInfo() {
    return;
  }

  getFileType() {
    return "geoTIFF";
  }

  async writeFileToOutput(filePath, outputPath) {
    const outCalc = !outputPath
      ? `${path.dirname(filePath)}${path.sep}output`
      : `${outputPath}${path.sep}output`;
    const outputPathAbsolute = getAbsolutePath(outCalc);
    const fileName = path.basename(filePath);
    const fileOutputPath = `${outputPathAbsolute}/${fileName}`;
    await copyFile(filePath, fileOutputPath);
  }
}
