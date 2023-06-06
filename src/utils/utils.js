import fs from 'fs';
import path from 'path';
import jschardet from 'jschardet';
import JSZip from 'jszip';


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
 * Unzips all .zip files in a folder
 * @param {String} folderPath 
 */
export async function unzipFiles(folderPath) {
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


/**
 * Clear the folder of all files except .zip and files that were in the folder before the process
 * @param {String} folderPath
 * @param {Array} filesBefore 
 */
export async function clearFolder(folderPath, filesBefore = []) {
    console.log(`Clearing folder ${folderPath}`);

    const files = await fs.promises.readdir(folderPath);

    // Delete all files except .zip and files that were in the folder before the process
    for (const file of files) {
        if (!file.endsWith('.zip') && !filesBefore.includes(file)) {
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

export const getAbsolutePath = (folderPath) => {
    if (path.isAbsolute(folderPath)) {
        return folderPath;
    }
    return path.join(process.cwd(), folderPath);
}