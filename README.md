# Shapefile Reader

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2012.0.0-brightgreen.svg)
![npm version](https://badge.fury.io/js/shapefile-reader.svg)

## Description

The library offers comprehensive functionalities to process shapefiles, parsing them into a structured JSON format. By invoking the provided methods, users can easily navigate through the geographical and attribute data associated with each shapefile contained within a designated folder.

```bash
nvm use
npm install
```

## Installation

Install the package via npm:

```bash
npm install @lbdudc/gp-shapefile-reader
```

## Usage

The library enables users to read and process shapefiles effortlessly. By initializing a Processor instance with configurable options and providing the path to the folder containing shapefiles, users can obtain a comprehensive JSON representation of the geographical and attribute data associated with each shapefile.

 ```js
import Processor from "shapefile-reader";

// Path to the folder with the shapefiles
const inputPath = './examples/shpfiles';
const outputPath = './examples'; // by default is the same as inputPath /output

const processor = new Processor({
    encoding: 'utf-8', // 'auto' by default || 'ascii' || 'utf8' || 'utf-8' || 'latin1' || 'binary' || 'base64' || 'hex'
    geographicInfo: false, // true by default, if true, the geographic information is included in the output
    records: false, // true by default, if true, the records are included in the output
});

processor.processFolder(inputPath, outputPath).then(
    (content) => {
    // returns an array of objects, for each shapefile
    // See Output JSON section for more details
        console.log(content);
    })
)
```

## Output

Upon completion of the processing, the output folder will contain various files corresponding to each shapefile, including .cpg, .dbf, .prj, .shp, .shx, and .sld files.

For example, with a 01_shapefile.shp, the output folder will contain the following files:

- 01_shapefile.cpg
- 01_shapefile.dbf
- 01_shapefile.prj
- 01_shapefile.shp
- 01_shapefile.shx
- 01_shapefile.sld

## Output JSON

The object returned by the processFolder method is an array of objects, one for each shapefile. Each object contains the following properties:

```json
[
    {

        "name": "01_shapefile",
        "fileName": "01_shapefile.shp",
        "schema": [
            {
                "name": "name",
                "type": "Number || String || Boolean || Geometry ...",
                "length": "Number"
            },
        ],
        "geographicInfo": {
            "done": false,
            "value": {
                "type": "Feature",
                "properties": {
                    "GEOID": 516864,
                    "FASE": "2000",
                },
                "geometry": {
                    "type": "MultiPoint",
                    "coordinates": [
                        [
                            568244.3307745245,
                            4782578.271440068
                        ]
                    ]
                }
            }
        },
        "records": {
            "done": false,
            "value": {
                "GEOID": 516864,
                "FASE": "2000",
            }
        }
    },

]
```

## Examples

Explore additional examples in the examples folder:

```bash
npm run example

```

## Dependencies

- **jschardet**: 3.0.0
- **jszip**: ^3.10.1
- **shapefile**: ^0.6.6

## Dev Dependencies

- **@vitest/coverage-istanbul**: ^0.32.2
- **vitest**: ^0.32.0

## Author

Victor Lamas
Email: <victor.lamas@udc.es>

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
