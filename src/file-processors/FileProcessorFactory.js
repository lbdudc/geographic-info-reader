import { ShapefileProcessor } from "./ShapefileProcessor.js";
import { GeopackageProcessor } from "./GeopackageProcessor.js";
import { GeoTiffProcessor } from "./GeotiffProcessor.js";
import path from "path";
import JSZip from "jszip";

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
  if (file.endsWith(ZIP_EXT)) {
    return await getFileProcessorForZip(
      file,
      inputPathAbsolute,
      outputPathAbsolute,
    );
  } else if (SHP_EXTS.some((ext) => file.endsWith(ext))) {
    return shapefileProcessor;
  } else if (file.endsWith(GPKG_EXT)) {
    return geopackageProcessor;
  } else if (file.endsWith(TIFF_EXT)) {
    return geotiffProcessor;
  }
  return null;
}

async function getFileProcessorForZip(
  file,
  inputPathAbsolute,
  outputPathAbsolute,
) {
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
  const fileData = await fs.readFile(fullFilePath);
  const zipData = await zip.loadAsync(fileData); // Cargar el ZIP en memoria

  const fileNames = Object.keys(zipData.files); // Obtener los nombres de los archivos

  return fileNames;
}

export default { getFileProcessorForFile };
