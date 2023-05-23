import Processor from "../index.js";

// Path to the folder with the shapefiles (cannot be a relative path)
const folderPath = 'C:/Users/victor/Desktop/dev/GEMA/shapefile-reader/examples/shpfiles/';

const processor = new Processor({
    encoding: 'utf-8', // 'auto' by default || 'ascii' || 'utf8' || 'utf-8' || 'latin1' || 'binary' || 'base64' || 'hex'
    geographicInfo: false, // true by default
    records: false, // true by default
});

processor.getSHPFolderInfo(folderPath).then(
    (content) => {
        console.log(JSON.stringify(content, null, 2));
    }
)