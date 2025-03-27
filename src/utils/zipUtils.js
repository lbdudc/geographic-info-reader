import fs from "fs";
import JSZip from "jszip";
import { clearShapefileRawFiles } from "./utils.js";
import path from "path";
import log from "./log.js";
import { SKIP_ZIP_EXTS } from "./file-extensions";

/**
 * Unzips a .zip file
 * @param zipPath
 * @param outputFolder
 * @returns {Promise<Array<String>>} extractedFilePaths
 */
export async function unzipFile(zipPath, outputFolder) {
  log(`Extract .zip file ${zipPath} to ${outputFolder}`);
  const zipData = fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(zipData);
  const extractedFilePaths = [];

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  for (const [relativePath, file] of Object.entries(zip.files)) {
    const outputPath = path.join(outputFolder, relativePath);
    if (file.dir) {
      fs.mkdirSync(outputPath, { recursive: true });
    } else {
      const content = await file.async("nodebuffer");
      fs.writeFileSync(outputPath, content);
      extractedFilePaths.push(outputPath);
    }
  }

  log("Extraction completed!");
  return extractedFilePaths;
}

/**
 * Groups the files of a folder by shapefile
 * @param {Path} folderPath
 */
export async function zipFilesGroupByShapefile(folderPath, shapefileName) {
  log(`Zip files of folder ${folderPath}`);

  // Read the files of the folder
  let files = fs.readdirSync(folderPath);

  // Group the files by shapefile, omitting the other extension files
  const filesByShapefile = [];
  for (const file of files) {
    if (
      SKIP_ZIP_EXTS.some((ext) => file.endsWith(ext)) ||
      path.parse(file).name !== shapefileName
    ) {
      continue;
    }
    filesByShapefile.push(file);
  }

  // Zip the files of each shapefile
  const zip = new JSZip();

  for (const file of filesByShapefile) {
    const filePath = folderPath + path.sep + file;
    const fileData = fs.readFileSync(filePath);
    zip.file(file, fileData);
  }

  const zipFilePath = folderPath + path.sep + shapefileName + ".zip";
  const content = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(zipFilePath, content);

  // Get the list of .zip files and .sld files
  files = fs.readdirSync(folderPath);
  const zipFiles = files.filter((file) => file.endsWith(".zip"));
  const sldFiles = files.filter((file) => file.endsWith(".sld"));
  const othersExtToKeep = files.filter((file) =>
    SKIP_ZIP_EXTS.some((ext) => file.endsWith(ext)),
  );

  // Clear the folder of all files except .zip files and .sld files and others extensions
  log("Clearing folder", folderPath);
  await clearShapefileRawFiles(folderPath, shapefileName);
}
