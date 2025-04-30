import fs from "fs";
import FileProcessorFactory from "./file-processors/FileProcessorFactory.js";
import { copyFile, getAbsolutePath } from "./utils/utils.js";
import path from "path";
import log from "./utils/log.js";
import { SHP_EXTS, SLD_EXT } from "./utils/file-extensions.js";

class Processor {
  constructor(options) {
    this.options = options || {
      encoding: "auto",
      schema: true,
      geographicInfo: true,
      outputPath: null,
    };
  }

  async processFolder(inputPath) {
    const absolutePath = getAbsolutePath(inputPath);

    const outCalc = !this.options.outputPath
      ? `${inputPath}${path.sep}output`
      : `${this.options.outputPath}${path.sep}output`;
    const outputPathAbsolute = getAbsolutePath(outCalc);

    // Process the output folder
    log(`Processing folder ${absolutePath}`);

    let content = [];
    const files = await fs.promises.readdir(absolutePath);

    //copy shapefiles extensions to ouput
    for (const file of files) {
      if (SHP_EXTS.some((ext) => file.endsWith(ext))) {
        const inputPath = `${absolutePath}/${file}`;
        const outputPath = `${outputPathAbsolute}/${file}`;
        await copyFile(inputPath, outputPath);
      }
    }
    for (const file of files) {
      let fileProcessor;
      try {
        fileProcessor = await FileProcessorFactory.getFileProcessorForFile(
          file,
          absolutePath,
        );
      } catch (error) {
        console.error("Skipping invalid file" + error);
      }

      if (fileProcessor) {
        const filePath = absolutePath + path.sep + file;
        const fileContent = await fileProcessor.process(filePath, this.options);
        content.push(fileContent);
      }
    }

    return content;
  }
}

export default Processor;
