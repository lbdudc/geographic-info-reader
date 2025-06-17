import { FileProcessor } from "./FileProcessor.js";
import path from "path";
import { copyFile, getAbsolutePath } from "../utils/utils.js";

export class SldProcessor extends FileProcessor {
  async process(filePath, options) {
    await this.writeFileToOutput(filePath, options.outputPath);
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
