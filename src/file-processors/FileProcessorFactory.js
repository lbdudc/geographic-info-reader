import { ShapefileProcessor } from "./ShapefileProcessor.js";
import { GeopackageProcessor } from "./GeopackageProcessor.js";
import { GeoTiffProcessor } from "./GeotiffProcessor.js";
import path from "path";
import { unzipFile } from "../utils/zipUtils.js";

const SHP_EXTS = [".shp", ".dbf", ".prj", ".cpg", ".shx"];
const GPKG_EXT = ".gpkg";
const TIFF_EXT = ".tif";
const ZIP_EXT = ".zip";

const fs = require("fs").promises;

const shapefileProcessor = new ShapefileProcessor();
const geopackageProcessor = new GeopackageProcessor();
const geotiffProcessor = new GeoTiffProcessor();

async function getFileProcessorForFile(
  file,
  inputPathAbsolute,
  outputPathAbsolute,
) {
  if (SHP_EXTS.some((ext) => file.endsWith(ext))) {
    return shapefileProcessor;
  } else if (file.endsWith(GPKG_EXT)) {
    return geopackageProcessor;
  } else if (file.endsWith(TIFF_EXT)) {
    return geotiffProcessor;
  } else if (file.endsWith(ZIP_EXT)) {
    return await getFileProcessorForZip(
      file,
      inputPathAbsolute,
      outputPathAbsolute,
    );
  }
  return null;
}

async function getFileProcessorForZip(
  file,
  inputPathAbsolute,
  outputPathAbsolute,
) {
  const extractedFilePaths = await zipExtractFilePaths(
    file,
    inputPathAbsolute,
    outputPathAbsolute,
  );

  let hasGeotiffFiles = false;
  let hasShapeFiles = false;
  let hasOtherTypes = false;

  for (let extractedFilePath of extractedFilePaths) {
    if (extractedFilePath.endsWith(TIFF_EXT)) {
      hasGeotiffFiles = true;
    } else if (SHP_EXTS.some((ext) => file.endsWith(ext))) {
      hasShapeFiles = true;
    } else {
      hasOtherTypes = true;
    }
    if (hasOtherTypes || (hasGeotiffFiles && hasShapeFiles)) {
      throw new Error("Not supported combination of file types");
    }
  }

  if (hasShapeFiles) {
    return shapefileProcessor;
  } else if (hasGeotiffFiles) {
    await copyFile(inputPathAbsolute, outputPathAbsolute, file);
    await Promise.all(
      extractedFilePaths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error);
        }
      }),
    );

    return geotiffProcessor;
  }
}

async function copyFile(inputPathAbsolute, outputPathAbsolute, file) {
  const originalZipFilePath = `${inputPathAbsolute}/${file}`;
  const destinationPath = `${outputPathAbsolute}/${file}`;
  await fs.copyFile(originalZipFilePath, destinationPath);
}

async function zipExtractFilePaths(
  file,
  inputPathAbsolute,
  outputPathAbsolute,
) {
  const filePath = `${inputPathAbsolute}/${file}`;
  const outputPath = outputPathAbsolute
    ? outputPathAbsolute
    : `${path.dirname(filePath)}${path.sep}output`;

  return await unzipFile(filePath, outputPath);
}

export default { getFileProcessorForFile };
