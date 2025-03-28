import { test, describe, expect } from "vitest";
import Processor from "../src/Processor";
import {
  rmdirSync,
  readFileSync,
  cpSync,
  existsSync,
  readdirSync,
  writeFileSync,
} from "fs";

describe("Processor", () => {
  test("Process folder", async () => {
    const testFolderPath = "./test/testData/processor";
    const inputFolderPath = "./test/testData/input";

    try {
      rmdirSync(`${testFolderPath}/output`, { recursive: true, force: true });
    } catch (error) {
      // Expect that the error is because the folder doesn't exist
      expect(error.code).toBe("ENOENT");
    }

    cpSync(`${inputFolderPath}`, `${testFolderPath}/input`, {
      recursive: true,
      force: true,
    });

    const processor = new Processor({
      encoding: "utf-8", // 'auto' by default || 'ascii' || 'utf8' || 'utf-8' || 'latin1' || 'binary' || 'base64' || 'hex'
      geographicInfo: false, // true by default
      outputPath: `${testFolderPath}/`,
    });

    const res = await processor.processFolder(`${testFolderPath}/input`);

    // Assert that the output folder contains the expected files
    const expectedJSONRes = JSON.parse(
      readFileSync(
        `${testFolderPath}/expectedOutput/expectedOutput.json`,
        "utf8",
      ),
    );
    const expectedFiles = JSON.parse(
      readFileSync(
        `${testFolderPath}/expectedOutput/expectedFiles.json`,
        "utf8",
      ),
    );

    expect(existsSync(`${testFolderPath}/output`)).toBe(true);

    const readFiles = readdirSync(`${testFolderPath}/output`);

    for (const expectedFile of expectedFiles) {
      expect(readFiles.includes(expectedFile)).toBe(true);
    }

    writeFileSync(
      `${testFolderPath}/output/output.json`,
      JSON.stringify(res, null, 2),
      "utf8",
    );

    expect(res).toStrictEqual(expectedJSONRes);
  });
}, 100000);
