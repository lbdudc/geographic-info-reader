import fs from 'fs';
import shapefile from 'shapefile';
import { detectEncoding } from './utils/utils.js';
import JSZip from 'jszip';



class Processor {

    constructor(options) {
        this.options = options || {
            encoding: 'auto',
            schema: true,
            geographicInfo: true,
            records: true,
        };
    }

    /**
     * Process the folder and generate a json object with the information of the shapefiles
     * @param {String} folderPath 
     * @returns {Object} content with the information of the shapefiles
     */
    async getSHPFolderInfo(folderPath) {
        console.log(`Processing folder ${folderPath}`);

        let content = [];

        await this._unzipFiles(folderPath);

        const files = await fs.promises.readdir(folderPath);

        // If file is a .shp, process it
        for (const file of files) {
            if (file.endsWith('.shp')) {
                const shapefilePath = folderPath + file;
                const fileContent = await this._processShapefile(shapefilePath);
                content.push(fileContent);
            }
        }

        await this._clearFolder(folderPath);

        return content;
    }


    /**
     * Process the shapefile and generate a json object with the information of the shapefile
     * @param {String} shapefilePath
     * @returns {Object} content with the information of the shapefile
     */
    async _processShapefile(shapefilePath) {
        const fileName = shapefilePath.split('/').pop();

        // Detect the encoding of the shapefile
        const encoding = this.options.encoding === 'auto' ? detectEncoding(shapefilePath) : this.options.encoding;

        console.log(`Processing ${fileName} with encoding ${encoding}`);

        // Retrieve the geographic information from .shp file
        const source = await shapefile.open(shapefilePath, undefined, {
            encoding: encoding
        });
        const geojson = await source.read();
        const geographicInfo = JSON.stringify(geojson);

        // Retrieve the data from .dbf file
        const dbfFilePath = shapefilePath.replace('.shp', '.dbf');
        const dbfData = await shapefile.openDbf(dbfFilePath);
        const records = await dbfData.read();

        // Retrieve the schema from .dbf file
        const schemaFields = dbfData._fields
            .filter((field, index, self) =>
                index === self.findIndex((t) => (
                    t.name === field.name && t.type === field.type
                ))
            )
            .map((field) => {
                return {
                    name: field.name,
                    type: field.type === 'N' ? 'Number' : 'String',
                    length: field.length,
                }
            });

        // Generate the final result
        let res = {
            name: fileName.split('.')[0],
            fileName: fileName,
            schema: schemaFields,
            geographicInfo: JSON.parse(geographicInfo),
            records: records,
        }

        // delete res keys if options.records or options.geographicInfo are false
        if (!this.options.records) delete res.records;
        if (!this.options.geographicInfo) delete res.geographicInfo;

        return res;
    }

    async _unzipFiles(folderPath) {
        console.log(`Unzipping .zip files in folder ${folderPath}`);

        const files = await fs.promises.readdir(folderPath);

        for (const file of files) {
            if (file.endsWith('.zip')) {
                const zipFilePath = folderPath + file;
                const zip = await JSZip.loadAsync(fs.readFileSync(zipFilePath));

                for (const zipEntry of Object.values(zip.files)) {
                    const entryFilePath = folderPath + zipEntry.name;
                    const entryFolderPath = entryFilePath.substring(0, entryFilePath.lastIndexOf('/'));

                    if (zipEntry.dir) {
                        // Create the directory if it doesn't exist
                        if (!fs.existsSync(entryFolderPath)) {
                            fs.mkdirSync(entryFolderPath, { recursive: true });
                        }
                    } else {
                        // Extract the file
                        const entryData = await zipEntry.async('nodebuffer');
                        fs.writeFileSync(entryFilePath, entryData);
                    }
                }

                console.log(`Extracted ${zipFilePath}`);
            }
        }

        console.log('Extraction completed');
    }

    async _clearFolder(folderPath) {
        console.log(`Clearing folder ${folderPath}`);

        const files = await fs.promises.readdir(folderPath);

        // Delete all files except .zip
        for (const file of files) {
            if (!file.endsWith('.zip')) {
                const filePath = folderPath + file;

                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                })
            }
        }
    }

}


export default Processor;