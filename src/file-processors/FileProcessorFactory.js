import fs from "fs";
import { ShapefileProcessor } from "./ShapefileProcessor.js";
import { GeopackageProcessor } from "./GeopackageProcessor.js";
import { GeoTiffProcessor } from "./GeotiffProcessor.js";
import path from "path";
import JSZip from "jszip";
import {
  SHP_EXTS,
  GPKG_EXT,
  TIFF_EXT,
  ZIP_EXT,
} from "../utils/file-extensions.js";

const shapefileProcessor = new ShapefileProcessor();
const geopackageProcessor = new GeopackageProcessor();
const geotiffProcessor = new GeoTiffProcessor();

async function getFileProcessorForFile(file, inputPathAbsolute) {
  if (file.endsWith(ZIP_EXT)) {
    return await getFileProcessorForZip(file, inputPathAbsolute);
  } else if (SHP_EXTS.some((ext) => file.endsWith(ext))) {
    return shapefileProcessor;
  } else if (file.endsWith(GPKG_EXT)) {
    return geopackageProcessor;
  } else if (file.endsWith(TIFF_EXT)) {
    return geotiffProcessor;
  }
  return null;
}

async function getFileProcessorForZip(file, inputPathAbsolute) {
  const extractedFileNames = await listFilesInZip(inputPathAbsolute, file);

  let hasGeotiffFiles = false;
  let hasShapeFiles = false;
  let hasOtherTypes = false;

  for (let extractedFileName of extractedFileNames) {
    if (extractedFileName.endsWith(TIFF_EXT)) {
      hasGeotiffFiles = true;
    } else if (SHP_EXTS.some((ext) => extractedFileName.endsWith(ext))) {
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
    return geotiffProcessor;
  }
}

async function listFilesInZip(inputPath, file) {
  const zip = new JSZip();
  const fullFilePath = path.join(inputPath, file);
  const fileData = await fs.promises.readFile(fullFilePath);
  const zipData = await zip.loadAsync(fileData); // Cargar el ZIP en memoria

  const fileNames = Object.keys(zipData.files); // Obtener los nombres de los archivos

  return fileNames;
}

export default { getFileProcessorForFile };
