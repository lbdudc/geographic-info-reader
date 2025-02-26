import { detectEncoding } from "../utils/utils.js";
import log from "../utils/log.js";
import path from "path";
import fs from "fs";

export class FileProcessor {
  async process(filePath, options) {
    // split the path to get the name of the file with "/"" or "\\"
    const fileName = filePath.split(path.sep).pop();

    // Detect file encoding
    const encoding =
      options.encoding === "auto" ? detectEncoding(filePath) : options.encoding;

    log(`Processing ${fileName} with encoding ${encoding}`);

    const fileData = await this.open(filePath, encoding);

    const schemaFields = await this.getSchemaFields(fileData);

    const sldFilePath = filePath.replace(/\.[^/.]+$/, ".sld");
    let hasSld = false;
    if (fs.existsSync(sldFilePath)) {
      hasSld = true;
    }

    let res = {
      name: fileName.split(".")[0],
      fileName: fileName,
      type: this.getFileType(),
      hasSld: hasSld,
      schema: schemaFields,
    };

    if (options.geographicInfo) {
      res.geographicInfo = await this.getGeographicInfo(fileData);
    }

    return res;
  }

  open() {
    throw new Error("open method must be implemented");
  }

  getSchemaFields() {
    throw new Error("getSchemaFields method must be implemented");
  }

  getGeographicInfo() {
    throw new Error("getGeographicInfo method must be implemented");
  }

  getFileType() {
    throw new Error("getFileType method must be implemented");
  }

  shouldZip() {
    throw new Error("shouldZip method must be implemented");
  }
}
