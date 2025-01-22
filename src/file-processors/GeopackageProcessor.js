import { FileProcessor } from "./FileProcessor";
import path from "path";
import log from "../utils/log.js";
import { detectEncoding } from "../utils/utils.js";
import fs from "fs";
import { GeoPackageAPI } from "@ngageoint/geopackage";

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
  constructor() {
    super();
  }

  async process(filePath, options) {
    // split the path to get the name of the file with "/"" or "\\"
    const fileName = filePath.split(path.sep).pop();

    // Detect file encoding
    const encoding =
      options.encoding === "auto" ? detectEncoding(filePath) : options.encoding;

    log(`Processing ${fileName} with encoding ${encoding}`);

    const geoPackageBuffer = fs.readFileSync(filePath);
    const geoPackage = await GeoPackageAPI.open(geoPackageBuffer);

    // Obtener todas las tablas de la base de datos GeoPackage
    const tables = geoPackage.getFeatureTables();
    const schemaFields = [];
    const features = [];

    for (const table of tables) {
      const featureDao = geoPackage.getFeatureDao(table);
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

    // Retrieve if exists the .sld file
    const sldFilePath = filePath.replace(".gpkg", ".sld");
    let hasSld = false;
    if (fs.existsSync(sldFilePath)) {
      hasSld = true;
    }

    let res = {
      name: fileName.split(".")[0],
      fileName: fileName,
      hasSld: hasSld,
      schema: schemaFields,
      geographicInfo: features,
    };

    // delete res keys if options.geographicInfo is false
    if (!options.geographicInfo) delete res.geographicInfo;

    return res;
  }

  _getTypeForGpkgDataType(gpkgDataType) {
    return NUMERIC_DATA_TYPES.includes(gpkgDataType) ? "Number" : "String";
  }

  _getGeometryTypeForIndex(index) {
    return GEOMETRY_TYPES[index];
  }
}
