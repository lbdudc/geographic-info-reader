import { FileProcessor } from "./FileProcessor.js";
import path from "path";
import { copyFile, getAbsolutePath } from "../utils/utils.js";

export class GeoTiffProcessor extends FileProcessor {
  async open(filePath, encoding, options) {
    const outCalc = !options.outputPath
      ? `${path.dirname(filePath)}${path.sep}output`
      : `${options.outputPath}${path.sep}output`;
    const outputPathAbsolute = getAbsolutePath(outCalc);
    const fileName = path.basename(filePath);
    const outputPath = `${outputPathAbsolute}/${fileName}`;
    await copyFile(filePath, outputPath);
  }

  async getSchemaFields(fileData) {
    return [];
  }

  async getGeographicInfo(fileData) {
    return;
  }

  getFileType() {
    return "geoTIFF";
  }

  shouldZip() {
    return false;
  }
}
