import { describe, expect, test } from "vitest";
import { unzipFile, zipFilesGroupByShapefile } from "../src/utils/zipUtils.js";
import { copyFile } from "../src/utils/utils.js";
import { cpSync, rmSync, existsSync, readdirSync, readFileSync } from "fs";
import path from "path";

describe("Zip Utils", () => {
  test("Unzip files in an non-existent output folder.", async () => {
    const testFolderPath = "./test/testData/zipUtils/clearZip";

    const inputFolderPath = "./test/testData/input";
    const tempInputFolderPath = `${testFolderPath}/input`;

    // Copy the files from the input folder to the temp input folder
    cpSync(`${inputFolderPath}`, `${tempInputFolderPath}`, {
      recursive: true,
      force: true,
    });

    // Preconditions
    // Output folder does not exist
    rmSync(`${testFolderPath}/output`, { recursive: true, force: true });
    expect(existsSync(`${testFolderPath}/output`)).toBe(false);

    // Variables
    const folderPath = `${tempInputFolderPath}`;
    const outputFolder = `${testFolderPath}/output`;

    const expectedFiles = JSON.parse(
      readFileSync(`${testFolderPath}/expectedOutput.json`, "utf8"),
    );

    // Execute the function
    const files = readdirSync(folderPath);

    for (const file of files) {
      if (file.endsWith(".zip")) {
        await unzipFile(
          `${tempInputFolderPath}${path.sep}${file}`,
          outputFolder,
        );
      } else {
        const inputPath = `${tempInputFolderPath}${path.sep}${file}`;
        const outputPath = `${outputFolder}${path.sep}${file}`;
        await copyFile(inputPath, outputPath);
      }
    }

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

  test("Unzip files and group by shapefile name", async () => {
    const testFolderPath = "./test/testData/zipUtils/groupZip";
    const inputFolderPath = "./test/testData/inputOnlyShapeFile";
    const tempInputFolderPath = `${testFolderPath}/input`;
    const shapefileExts = [".zip", ".shp"];

    // Copy the files from the input folder to the temp input folder
    cpSync(`${inputFolderPath}`, `${tempInputFolderPath}`, {
      recursive: true,
      force: true,
    });

    rmSync(`${testFolderPath}/output`, { recursive: true, force: true });
    expect(existsSync(`${testFolderPath}/output`)).toBe(false);

    // Variables
    const folderPath = `${tempInputFolderPath}`;
    const outputFolder = `${testFolderPath}/output`;

    const files = readdirSync(folderPath);

    for (const file of files) {
      if (file.endsWith(".zip")) {
        await unzipFile(
          `${tempInputFolderPath}${path.sep}${file}`,
          outputFolder,
        );
      } else {
        const inputPath = `${tempInputFolderPath}${path.sep}${file}`;
        const outputPath = `${outputFolder}${path.sep}${file}`;
        await copyFile(inputPath, outputPath);
      }
    }

    for (const file of files) {
      const filePath = path.parse(file);
      if (shapefileExts.some((ext) => filePath.ext == ext)) {
        await zipFilesGroupByShapefile(outputFolder, filePath.name);
      }
    }

    // Expect that the output folder is created
    expect(existsSync(outputFolder)).toBe(true);

    // Assert that the output folder contains the expected files
    const actualFiles = readdirSync(outputFolder);

    const expectedFiles = JSON.parse(
      readFileSync(`${testFolderPath}/expectedOutput.json`, "utf8"),
    );
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
    cpSync(`${inputFolderPath}`, `${tempInputFolderPath}`, {
      recursive: true,
      force: true,
    });

    expect(existsSync(`${testFolderPath}/output`)).toBe(false);

    try {
      const files = readdirSync(tempInputFolderPath);

      for (const file of files) {
        if (file.endsWith(".zip")) {
          await unzipFile(
            `${tempInputFolderPath}${path.sep}${file}`,
            `${testFolderPath}/output`,
          );
        } else {
          const inputPath = `${tempInputFolderPath}${path.sep}${file}`;
          const outputPath = `${testFolderPath}${path.sep}${file}`;
          await copyFile(inputPath, outputPath);
        }
      }
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
