import fs from "fs";
import path from "path";
import jschardet from "jschardet";
import log from "./log.js";

/**
 * Detects the encoding of a file
 * @param {String} filePath
 * @returns {String} encoding
 */
export function detectEncoding(filePath) {
  const buffer = fs.readFileSync(filePath);
  const detectedResult = jschardet.detect(buffer);
  return detectedResult.encoding;
}

/**
 * Clear the folder of all files except .zip and files that were in the folder before the process
 * @param {String} folderPath
 * @param {Array} filesBefore
 */
export async function clearFolder(folderPath, filesBefore = []) {
  log(`Clearing folder ${folderPath}`);
  log(`Files before: ${filesBefore}`);

  const files = fs.readdirSync(folderPath);

  // Delete all files except the ones that were in the folder before the process
  for (const file of files) {
    if (!filesBefore.includes(file)) {
      const filePath = folderPath + path.sep + file;
      fs.unlinkSync(filePath);
      log(`File ${filePath} deleted`);
    } else {
      log(`File ${file} was in the folder before the process`);
    }
  }

  log(`Folder ${folderPath} cleared`);
}

export const getAbsolutePath = (folderPath) => {
  if (path.isAbsolute(folderPath)) {
    return folderPath;
  }
  return path.join(process.cwd(), folderPath);
};

export function copyFile(inputPathAbsolute, outputPathAbsolute) {
  return new Promise((resolve, reject) => {
    const outputDirectory = path.dirname(outputPathAbsolute);
    if (!fs.existsSync(outputDirectory)) {
      try {
        fs.mkdirSync(outputDirectory, { recursive: true });
      } catch (err) {
        return reject(
          new Error(`Error al crear el directorio de destino: ${err.message}`),
        );
      }
    }

    fs.copyFile(inputPathAbsolute, outputPathAbsolute, (err) => {
      if (err) {
        console.error(`Error copying file: ${err.message}`);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
