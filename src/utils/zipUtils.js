import fs from "fs";
import JSZip from "jszip";
import { clearFolder } from "./utils.js";
import path from "path";

/**
 * Unzips all .zip files in a folder
 * @param {String} folderPath
 */
export async function unzipFiles(folderPath, outputFolder) {
  console.log(`Extract .zip files of folder ${folderPath}`);
  // outputFolder = !outputFolder ? folderPath + "/output" : outputFolder;

  console.log(`Output folder ${outputFolder}`);

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  } else {
    // Clear the output folder
    await clearFolder(outputFolder);
  }

  // Read the original files before the process
  const firstFiles = await fs.promises.readdir(folderPath);

  // Unzip all .zip files recursively in the output folder
  await _unzipFilesRecursive(folderPath, outputFolder, []);

  // Clear the original folder of all files except .zip files that were in the folder before the process
  await clearFolder(folderPath, firstFiles);

  console.log("Extraction completed!");
}

/**
 * Groups the files of a folder by shapefile
 * @param {Path} folderPath
 */
export async function zipFilesGroupByShapefile(folderPath) {
  console.log(`Zip files of folder ${folderPath}`);

  // Read the files of the folder
  let files = fs.readdirSync(folderPath);

  // Group the files by shapefile, omitting the .sld files
  const filesByShapefile = {};
  for (const file of files) {
    if (file.endsWith(".sld")) {
      continue;
    }
    const shapefileName = file.substring(0, file.lastIndexOf("."));
    if (!filesByShapefile[shapefileName]) {
      filesByShapefile[shapefileName] = [];
    }
    filesByShapefile[shapefileName].push(file);
  }

  // Zip the files of each shapefile
  for (const shapefileName of Object.keys(filesByShapefile)) {
    const files = filesByShapefile[shapefileName];
    const zip = new JSZip();

    for (const file of files) {
      const filePath = folderPath + path.sep + file;
      const fileData = fs.readFileSync(filePath);
      zip.file(file, fileData);
    }

    const zipFilePath = folderPath + path.sep + shapefileName + ".zip";
    const content = await zip.generateAsync({ type: "nodebuffer" });
    fs.writeFileSync(zipFilePath, content);
  }

  // Get the list of .zip files and .sld files
  files = fs.readdirSync(folderPath);
  const zipFiles = files.filter((file) => file.endsWith(".zip"));
  const sldFiles = files.filter((file) => file.endsWith(".sld"));

  // Clear the folder of all files except .zip files and .sld files
  console.log("Clearing folder", folderPath);
  await clearFolder(folderPath, zipFiles.concat(sldFiles));
}

/**
 * Unzips all .zip files in a folder recursively
 * @param {String} folderPath
 * @param {String} outputFolder
 * @param {Array[String]} prevReadZipFiles
 * @param {Array[String]} firstFiles
 */
const _unzipFilesRecursive = async (
  folderPath,
  outputFolder,
  prevReadZipFiles,
  firstFiles,
) => {
  const files = await fs.promises.readdir(folderPath);

  for (const file of files) {
    if (file.endsWith(".zip") && !prevReadZipFiles.includes(file)) {
      const zipFilePath = folderPath + path.sep + file;
      const zip = await JSZip.loadAsync(fs.readFileSync(zipFilePath));

      for (const zipEntry of Object.values(zip.files)) {
        const entryFilePath = folderPath + path.sep + zipEntry.name;
        const entryFolderPath = entryFilePath.substring(
          0,
          entryFilePath.lastIndexOf(path.sep),
        );

        if (zipEntry.dir) {
          // Create the directory if it doesn't exist
          if (!fs.existsSync(entryFolderPath)) {
            fs.mkdirSync(entryFolderPath, { recursive: true });
          }
        } else {
          // Extract the file in the outputFolder path
          const entryData = await zipEntry.async("nodebuffer");
          fs.writeFileSync(entryFilePath, entryData);
        }
      }

      console.log(`Extracted ${zipFilePath}`);
      prevReadZipFiles.push(zipFilePath);
    }
  }

  // Check if there are more .zip files to unzip
  const filesAfter = await fs.promises.readdir(folderPath);
  const zipFiles = filesAfter
    .filter((file) => file.endsWith(".zip"))
    .filter((file) => {
      return !prevReadZipFiles
        .map((file) => file.substring(file.lastIndexOf(path.sep) + 1))
        .includes(file);
    });

  // If there are more .zip files, unzip them
  if (zipFiles.length > 0) {
    await _unzipFilesRecursive(
      folderPath,
      outputFolder,
      prevReadZipFiles,
      firstFiles,
    );
  } else {
    // Finally copy all files to the output folder

    for (const file of filesAfter) {
      if (
        !file.endsWith(".zip") &&
        !fs.lstatSync(folderPath + path.sep + file).isDirectory()
      ) {
        console.log(file);
        const filePath = folderPath + path.sep + file;
        const outputFilePath = outputFolder + path.sep + file;
        fs.copyFileSync(filePath, outputFilePath);
      }
    }
  }
};
