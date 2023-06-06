# Shapefile Reader

## Description

Shapefile reader for Node.js, reads a folder and returns a JSON with the data of the shapefiles

## Installation

In your `package.json` add the following line:

```json
dependencies: {
    "shapefile-reader": "git+https://gitlab.lbd.org.es/GEMA/lps/gisbuilder2/shapefile-reader"
}
```

```bash
nvm use
npm install
```

## Usage

More examples in the `examples` folder

```javascript
import Processor from "shapefile-reader";

// Path to the folder with the shapefiles
const inputPath = './examples/shpfiles';
const outputPath = './examples'; // by default is the same as inputPath /output

const processor = new Processor({
    encoding: 'utf-8', // 'auto' by default || 'ascii' || 'utf8' || 'utf-8' || 'latin1' || 'binary' || 'base64' || 'hex'
    geographicInfo: false, // true by default
    records: false, // true by default
});

processor.processFolder(inputPath, outputPath).then(
    (content) => {
        // save to output.json
        // fs.writeFileSync('./examples/output.json', JSON.stringify(content, null, 2));
        // console.log(JSON.stringify(content, null, 2));
    })
)
