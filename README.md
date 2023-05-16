# Shapefile Reader

## Description

Shapefile reader for Node.js, reads a folder and returns a JSON with the data of the shapefiles

## Installation

In your `package.json` add the following line:

```json
dependencies: {
    "shapefile-reader": "git+"
}
```

```bash
npm install
```

## Usage

More examples in the `examples` folder

```javascript
import Processor from "shapefile-reader";

// Path to the folder with the shapefiles (cannot be a relative path)
const folderPath = '/home/user/shapefiles/';

// Create a new instance of the processor
const processor = new Processor({
    encoding: 'utf-8', // 'auto' by default || 'ascii' || 'utf8' || 'utf-8'
    geographicInfo: false, // true by default
    records: false, // true by default
});

// Get the info of the shapefiles in the folder
processor.getSHPFolderInfo(folderPath).then(
    (res) => {
    // returns an array with the info of the shapefiles
    // [ {
    //     "name": "t_parques",
    //     "fileName": "t_parques.shp",
    //     "schema": [
    //       {
    //         "name": "agua",
    //         "type": "String",
    //         "length": 254
    //       },
    //       {
    //         "name": "comedor",
    //         "type": "String",
    //         "length": 254
    //       },
    //     }
    //              ...
    // ]
)
