import fs from 'fs';
import path from 'path';
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


/**
 * Clear the folder of all files except .zip and files that were in the folder before the process
 * @param {String} folderPath
 * @param {Array} filesBefore 
 */
export async function clearFolder(folderPath, filesBefore = []) {
    console.log(`Clearing folder ${folderPath}`);

    const files = await fs.promises.readdir(folderPath);

    // Delete all files except the ones that were in the folder before the process
    for (const file of files) {
        if (!filesBefore.includes(file)) {
            const filePath = folderPath + "/" + file;

            fs.unlinkSync(filePath, (err) => {
                if (err) {
                    console.error(err)
                    return
                }
            })
        }
    }
}

export const getAbsolutePath = (folderPath) => {
    if (path.isAbsolute(folderPath)) {
        return folderPath;
    }
    return path.join(process.cwd(), folderPath);
}