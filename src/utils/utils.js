import fs from 'fs';
import jschardet from 'jschardet';


/**
 * Detects the encoding of a file
 * @param {String} filePath
 * @returns {String} encoding
 */
export function detectEncoding(filePath) {
    const buffer = fs.readFileSync(filePath);
    const detectedResult = jschardet.detect(buffer);
    return detectedResult.encoding;
}