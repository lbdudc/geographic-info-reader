import { ShapefileProcessor } from "./ShapefileProcessor.js";
import { GeopackageProcessor } from "./GeopackageProcessor.js";

const SHP_EXT = ".shp";
const GPKG_EXT = ".gpkg";

const shapefileProcessor = new ShapefileProcessor();
const geopackageProcessor = new GeopackageProcessor();

function getFileProcessorForFile(file) {
  if (file.endsWith(SHP_EXT)) {
    return shapefileProcessor;
  } else if (file.endsWith(GPKG_EXT)) {
    return geopackageProcessor;
  }
  return null;
}

export default { getFileProcessorForFile };
