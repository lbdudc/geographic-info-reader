import { FileProcessor } from "./FileProcessor.js";
import fs from "fs";
import { GeoPackageAPI } from "@ngageoint/geopackage";
import path from "path";
import { detectEncoding } from "../utils/utils.js";
import log from "../utils/log.js";

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
  async process(filePath, options) {
    // Process .gpkg file
    const gpkgPath = filePath;
    const gpkgName = path.basename(gpkgPath);

    // Detect file enconding
    const encoding =
      options.encoding === "auto" ? detectEncoding(gpkgPath) : options.encoding;

    log(`Processing ${gpkgPath} with encoding ${encoding}`);

    const fileData = await this.open(gpkgPath, encoding);

    const schemaFields = await this.getSchemaFields(fileData);

    let res = {
      name: gpkgName.split(".")[0],
      fileName: gpkgName,
      type: this.getFileType(),
      schema: schemaFields,
    };

    if (options.geographicInfo) {
      res.geographicInfo = await this.getGeographicInfo(fileData);
    }

    return res;
  }

  async open(filePath) {
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
