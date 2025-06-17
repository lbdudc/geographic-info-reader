import fs from "fs";
import FileProcessorFactory from "./file-processors/FileProcessorFactory.js";
import { getAbsolutePath } from "./utils/utils.js";
import path from "path";
import log from "./utils/log.js";

class Processor {
  constructor(options) {
    this.options = options || {
      encoding: "auto",
      schema: true,
      geographicInfo: true,
      outputPath: null,
      inputPath: null,
    };
  }

  async processFolder(inputPath) {
    const absolutePath = getAbsolutePath(inputPath);
    // Process the output folder
    log(`Processing folder ${absolutePath}`);

    let content = [];
    const files = fs.readdirSync(absolutePath);

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
        if (fileContent) content.push(fileContent);
      }
    }

    return content;
  }
}

export default Processor;
