import { FileProcessor } from "./FileProcessor.js";

export class GeoTiffProcessor extends FileProcessor {
  async open(filePath, encoding, options) {
    return;
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
