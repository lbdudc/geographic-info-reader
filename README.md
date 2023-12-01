# Shapefile Reader

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2012.0.0-brightgreen.svg)
![npm version](https://badge.fury.io/js/shapefile-reader.svg)

## Description

The library offers comprehensive functionalities to process shapefiles, parsing them into a structured JSON format. By invoking the provided methods, users can easily navigate through the geographical and attribute data associated with each shapefile contained within a designated folder.

## Installation

Install the package via npm:

```bash
npm install @lbdudc/gp-shapefile-reader
```

## Usage

This library simplifies the reading and processing of shapefiles. To utilize its functionalities:

1. **Input:** Refer to the "Input" section to understand the supported file formats and their requirements.

2. **Initialization:** Create an instance of the Processor class, configuring it with the desired options.

3. **Path Specification:** Provide the path to the folder containing the shapefiles to the Processor instance.

4. **Output:** Check the "Output" section for details on the generated output structure and file formats.

Once initialized and provided with the necessary inputs, the Processor will generate a comprehensive JSON representation. This representation includes both geographical and attribute data associated with each shapefile.

 ```js
import Processor from "shapefile-reader";

// Define the path to the folder containing the shapefiles
const inputPath = './examples/shpfiles';
const outputPath = './examples'; // By default, the output path is the same as the inputPath appended with '/output'

// Create a new Processor instance with customizable options
const processor = new Processor({
    encoding: 'utf-8', // Set the file encoding: 'auto' (default), 'ascii', 'utf8', 'utf-8', 'latin1', 'binary', 'base64', 'hex'
    geographicInfo: false, // Include geographic information in the output (default: true)
    records: false, // Include records in the output (default: true)
    outputPath: outputPath // Optional: designate a specific folder for processed shapefiles
});

// Process the folder containing the shapefiles
processor.processFolder(inputPath).then(
    (content) => {
        // Returns an array of objects, each representing a shapefile
        // Refer to the Output JSON section for more information
        console.log(content);
    }
);

```

## Overview

### Input

This library supports processing geographic data stored in Shapefile format. It accepts:

- Individual files with extensions: `.shp`, `.cpg`, `.dbf`, `.prj`, `.qpj`, `.shx`.
- Compressed data with Shapefile information in a `.zip` file.

The library efficiently handles these inputs for easy manipulation and analysis of geographic data.

**Note:** Ensure associated files share the same base name for the shapefile. Failure to do so may result in processing errors or incomplete data.

### Output

The output folder will contain the Shapefiles zipped by their respective names.

#### Example

Suppose you have a set of Shapefile files named:

- `example.shp`
- `example.cpg`
- `example.dbf`
- `example.prj`
- `example.qpj`
- `example.shx`

When processed using this library, the output folder will include a zip file named `example.zip`, containing all these associated files.

### Output JSON

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
