import Processor from "../index.js";
import path from "path";

// Path to the folder with the shapefiles
const inputPath = `.${path.sep}examples${path.sep}shpfiles`;
const outputPath = `.${path.sep}examples`;

const processor = new Processor({
  encoding: "utf-8", // 'auto' by default || 'ascii' || 'utf8' || 'utf-8' || 'latin1' || 'binary' || 'base64' || 'hex'
  geographicInfo: false, // true by default
  records: false, // true by default
  outputPath: outputPath,
});

processor.processFolder(inputPath).then((content) => {
  console.log(content);
  // save to output.json
  // fs.writeFileSync('./examples/output.json', JSON.stringify(content, null, 2));
  // console.log(JSON.stringify(content, null, 2));
});
