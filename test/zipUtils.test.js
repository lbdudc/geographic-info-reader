import { describe, expect, test } from "vitest";
import { unzipFiles, zipFilesGroupByShapefile } from "../src/utils/zipUtils.js";
import fs, { rmSync, existsSync, readdirSync, readFileSync, readSync, mkdirSync } from 'fs';

describe("Zip Utils", () => {

    test("Unzip files in an non-existent output folder.", async () => {

        const testFolderPath = "./test/testData/zipUtils/clearZip";

        const inputFolderPath = "./test/testData/input";
        const tempInputFolderPath = `${testFolderPath}/input`;

        // Copy the files from the input folder to the temp input folder
        fs.cpSync(`${inputFolderPath}`, `${tempInputFolderPath}`, { recursive: true, force: true });

        // Preconditions
        // Output folder does not exist
        rmSync(`${testFolderPath}/output`, { recursive: true, force: true });
        expect(existsSync(`${testFolderPath}/output`)).toBe(false);

        // Variables
        const folderPath = `${tempInputFolderPath}`;
        const outputFolder = `${testFolderPath}/output`;

        const expectedFiles = JSON.parse(readFileSync(`${testFolderPath}/expectedOutput.json`, 'utf8'));

        // Execute the function
        await unzipFiles(folderPath, outputFolder);

        // Expect that the output folder is created
        expect(existsSync(outputFolder)).toBe(true);

        // Assert that the output folder contains the expected files
        const actualFiles = readdirSync(outputFolder);
        expect(actualFiles).toEqual(expectedFiles);

        // Remove the output folder
        rmSync(`${testFolderPath}/output`, { recursive: true, force: true });
        expect(existsSync(`${testFolderPath}/output`)).toBe(false);

        // Remove the temp input folder
        rmSync(`${tempInputFolderPath}`, { recursive: true, force: true });
    });

    test("Unzip files and group by name", async () => {

        const testFolderPath = "./test/testData/zipUtils/groupZip";
        const inputFolderPath = "./test/testData/input";
        const tempInputFolderPath = `${testFolderPath}/input`;

        // Copy the files from the input folder to the temp input folder
        fs.cpSync(`${inputFolderPath}`, `${tempInputFolderPath}`, { recursive: true, force: true });


        rmSync(`${testFolderPath}/output`, { recursive: true, force: true });
        expect(existsSync(`${testFolderPath}/output`)).toBe(false);

        // Variables
        const folderPath = `${tempInputFolderPath}`;
        const outputFolder = `${testFolderPath}/output`;

        await unzipFiles(folderPath, outputFolder);

        await zipFilesGroupByShapefile(outputFolder);

        // Expect that the output folder is created
        expect(existsSync(outputFolder)).toBe(true);

        // Assert that the output folder contains the expected files
        const actualFiles = readdirSync(outputFolder);

        const expectedFiles = JSON.parse(readFileSync(`${testFolderPath}/expectedOutput.json`, 'utf8'));
        expect(actualFiles).toEqual(expectedFiles);

        // Remove the output folder
        rmSync(`${testFolderPath}/output`, { recursive: true, force: true });
        expect(existsSync(`${testFolderPath}/output`)).toBe(false);

        // Remove the temp input folder
        rmSync(`${tempInputFolderPath}`, { recursive: true, force: true });
    });

    test("Unzip files in a folder with no.zip files.", async () => {

        const inputFolderPath = "./test/testData/input";
        const testFolderPath = "./test/testData/zipUtils/noZip";
        const tempInputFolderPath = `${testFolderPath}/input`;

        // Copy the files from the input folder to the temp input folder
        fs.cpSync(`${inputFolderPath}`, `${tempInputFolderPath}`, { recursive: true, force: true });

        expect(existsSync(`${testFolderPath}/output`)).toBe(false);

        try {
            await unzipFiles(`${tempInputFolderPath} `, `${testFolderPath}/output`);
        } catch (error) {
            // Find in the error message the words: no such file or directory
            expect(error.message).toMatch(/no such file or directory/);
        }

        // It also creates the output folder
        expect(existsSync(`${testFolderPath}/output`)).toBe(true);

        // Remove the temp input folder
        rmSync(`${testFolderPath}`, { recursive: true, force: true });
    });

});