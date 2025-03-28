import { FileProcessor } from "./FileProcessor.js";
import fs from "fs";
import { GeoPackageAPI } from "@ngageoint/geopackage";
import path from "path";
import { copyFile, getAbsolutePath } from "../utils/utils.js";

const NUMERIC_DATA_TYPES = [7, 6, 4, 5, 3, 8, 2, 1];
const GEOMETRY_TYPES = [
  "Geometry",
  "Point",
  "MultiLineString",
  "MultiPolygon",
  "MultiPoint",
  "MultiLineString",
  "MultiPolygon",
];

export class GeopackageProcessor extends FileProcessor {
  async open(filePath, encoding, options) {
    const outCalc = !options.outputPath
      ? `${path.dirname(filePath)}${path.sep}output`
      : `${options.outputPath}${path.sep}output`;
    const outputPathAbsolute = getAbsolutePath(outCalc);
    const fileName = path.basename(filePath);
    const outputPath = `${outputPathAbsolute}/${fileName}`;
    await copyFile(filePath, outputPath);

    const geoPackageBuffer = fs.readFileSync(filePath);
    return await GeoPackageAPI.open(geoPackageBuffer);
  }

  async getSchemaFields(fileData) {
    // Obtener todas las tablas de la base de datos GeoPackage
    const tables = fileData.getFeatureTables();
    const schemaFields = [];

    if (tables.length > 0) {
      const table = tables[0];
      const featureDao = fileData.getFeatureDao(table);
      // Obtener las columnas (atributos) de la tabla
      const columns = featureDao.getFeatureTable().columns;
      // Mostrar nombre, tipo y longitud de cada columna
      for (let index = 0; index < columns.columnCount(); index++) {
        const column = columns.getColumnForIndex(index);
        if (column.isGeometry()) {
          schemaFields.push({
            name: column.getName(),
            type: this._getGeometryTypeForIndex(column.getGeometryType()),
          });
        } else {
          schemaFields.push({
            name: column.getName(),
            type: this._getTypeForGpkgDataType(column.getDataType()),
            length: column.getMax(),
          });
        }
      }
    }
    return schemaFields;
  }

  async getGeographicInfo(fileData) {
    // Obtener todas las tablas de la base de datos GeoPackage
    const tables = fileData.getFeatureTables();
    const features = [];

    if (tables.length > 0) {
      const table = tables[0];
      const featureDao = fileData.getFeatureDao(table);
      const featureIterator = featureDao.queryForAll();

      for (const row of featureIterator) {
        const featureRow = featureDao.getRow(row);

        // Convertir la geometría a GeoJSON
        const geometry = featureRow.geometry
          ? featureRow.geometry.geometry.toGeoJSON()
          : null;

        // Construir la feature en formato GeoJSON
        const properties = {};
        for (let index = 0; index < featureRow.columnCount; index++) {
          const column = featureRow.getColumnWithIndex(index);
          if (column.getName() !== featureRow.geometryColumn.getName()) {
            properties[column.getName()] = featureRow.getValueWithIndex(index);
          }
        }

        const feature = {
          type: "Feature",
          geometry: geometry,
          properties: properties,
        };

        features.push(feature);
      }
    }
    return features;
  }

  getFileType() {
    return "geoPackage";
  }

  _getTypeForGpkgDataType(gpkgDataType) {
    return NUMERIC_DATA_TYPES.includes(gpkgDataType) ? "Number" : "String";
  }

  _getGeometryTypeForIndex(index) {
    return GEOMETRY_TYPES[index];
  }

  shouldZip() {
    return false;
  }
}
