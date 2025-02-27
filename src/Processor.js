import fs from "fs";
import shapefile from "shapefile";
import FileProcessorFactory from "./file-processors/FileProcessorFactory.js";
import { detectEncoding, getAbsolutePath } from "./utils/utils.js";
import { zipFilesGroupByShapefile } from "./utils/zipUtils.js";
import path from "path";
import log from "./utils/log.js";

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
    const inputPathAbsolute = getAbsolutePath(inputPath);

    const outCalc = !this.options.outputPath
      ? `${inputPath}${path.sep}output`
      : `${this.options.outputPath}${path.sep}output`;
    const outputPathAbsolute = getAbsolutePath(outCalc);

    // Process the output folder
    log(
      ` -- PHASE (1/2): Process geographic files folder ${inputPathAbsolute}`,
    );
    const res = await this.getFolderInfo(inputPathAbsolute);

    // Reorder the output folder (group by shapefile) this clears the .shp, .dbf and .shx files
    log(
      ` -- PHASE (2/2): Reorder and clean the output folder ${outputPathAbsolute}`,
    );
    const files = await fs.promises.readdir(outputPathAbsolute);
    for (const file of files) {
      const fileProcessor = FileProcessorFactory.getFileProcessorForFile(file);
      if (fileProcessor) {
        const shouldZip = fileProcessor.shouldZip();

        if (shouldZip) {
          log(`- Zipping files`);
          await zipFilesGroupByShapefile(outputPathAbsolute);
          return res;
        }
      }
    }

    return res;
  }

  /**
   * Process the folder and generate a json object with the information of the geographic files
   * @param {String} folderPath
   * @returns {Object} content with the information of the geographic files
   */
  async getFolderInfo(folderPath) {
    let absolutePath = getAbsolutePath(folderPath);

    log(`Processing folder ${absolutePath}`);

    let content = [];
    const files = await fs.promises.readdir(absolutePath);

    for (const file of files) {
      const fileProcessor = FileProcessorFactory.getFileProcessorForFile(file);
      if (fileProcessor) {
        const filePath = absolutePath + path.sep + file;
        const fileContent = await fileProcessor.process(filePath, this.options);
        content.push(fileContent);
      }
    }

    return content;
  }

  /**
   * Process the shapefile and generate a json object with the information of the shapefile
   * @param {String} shapefilePath
   * @returns {Object} content with the information of the shapefile
   */
  async _processShapefile(shapefilePath) {
    // split the path to get the name of the file with "/"" or "\\"
    const fileName = shapefilePath.split(path.sep).pop();

    // Detect the encoding of the shapefile
    const encoding =
      this.options.encoding === "auto"
        ? detectEncoding(shapefilePath)
        : this.options.encoding;

    log(`Processing ${fileName} with encoding ${encoding}`);

    // Retrieve the geographic information from .shp file
    const source = await shapefile.open(shapefilePath, undefined, {
      encoding: encoding,
    });
    const geojson = await source.read();
    const geographicInfo = JSON.stringify(geojson);

    // Retrieve if exists the .sld file
    const sldFilePath = shapefilePath.replace(".shp", ".sld");
    let hasSld = false;
    if (fs.existsSync(sldFilePath)) {
      hasSld = true;
    }

    // Retrieve the data from .dbf file
    const dbfFilePath = shapefilePath.replace(".shp", ".dbf");
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
    if (!this.options.geographicInfo) delete res.geographicInfo;

    return res;
  }
}

export default Processor;
