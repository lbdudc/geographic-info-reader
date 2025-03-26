import { describe, expect, test } from "vitest";
import { clearShapefileRawFiles } from "../src/utils/utils";
import { existsSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "fs";
import path from "path";

describe("Utils", () => {
  test("Clear folder and all the files", async () => {
    // Create a folder with files
    const testFolderPath = "./test/testData/utils/clearFolder";

    mkdirSync(testFolderPath, { recursive: true });
    expect(existsSync(testFolderPath)).toBe(true);

    // Create files
    const files = ["file1.txt", "file2.txt", "file3.txt"];
    files.forEach((file) => {
      writeFileSync(`${testFolderPath}/${file}`, "test");
    });

    for (const file of files) {
      await clearShapefileRawFiles(testFolderPath, path.parse(file).name);
    }
    // Expect that the folder is empty
    expect(readdirSync(testFolderPath)).toEqual([]);

    // Delete all files
    rmSync(testFolderPath, { recursive: true, force: true });
    expect(existsSync(testFolderPath)).toBe(false);
  });

  test("Clear folder and all the files except the ones that were in the folder before the process", async () => {
    // Create a folder with files
    const testFolderPath = "./test/testData/utils";

    mkdirSync(testFolderPath, { recursive: true });
    expect(existsSync(testFolderPath)).toBe(true);

    // Create files
    const files = ["file1.txt", "file2.txt", "file3.txt"];
    files.forEach((file) => {
      writeFileSync(`${testFolderPath}/${file}`, "test");
    });

    await clearShapefileRawFiles(testFolderPath, "file3");

    // Expect that the folder is empty
    expect(readdirSync(testFolderPath)).toEqual(["file1.txt", "file2.txt"]);

    // Delete all files
    rmSync(testFolderPath, { recursive: true, force: true });
    expect(existsSync(testFolderPath)).toBe(false);
  });
});
