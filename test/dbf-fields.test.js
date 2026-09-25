import { test, describe, expect } from "vitest";
import { writeFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import {
  readDbfFields,
  schemaTypeOfDbfField,
} from "../src/utils/dbf-fields.js";

/** A DBF with the given [name, type, length, decimals] fields and no records. */
const buildDbf = (fields) => {
  const headerLength = 32 + fields.length * 32 + 1;
  const buf = Buffer.alloc(headerLength);
  buf[0] = 0x03;
  buf.writeUInt16LE(headerLength, 8);
  fields.forEach(([name, type, length, decimals], i) => {
    const o = 32 + i * 32;
    buf.write(name, o, "latin1");
    buf[o + 11] = type.charCodeAt(0);
    buf[o + 16] = length;
    buf[o + 17] = decimals;
  });
  buf[headerLength - 1] = 0x0d;
  return buf;
};

describe("readDbfFields", () => {
  test("reads name, type, length and decimals", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "dbf-"));
    const file = path.join(dir, "a.dbf");
    writeFileSync(
      file,
      buildDbf([
        ["ID", "N", 10, 0],
        ["AREA", "N", 19, 6],
        ["NAME", "C", 40, 0],
        ["WHEN", "D", 8, 0],
        ["OK", "L", 1, 0],
        ["RATIO", "F", 12, 4],
      ]),
    );
    expect(readDbfFields(file)).toEqual([
      { name: "ID", type: "N", length: 10, decimals: 0 },
      { name: "AREA", type: "N", length: 19, decimals: 6 },
      { name: "NAME", type: "C", length: 40, decimals: 0 },
      { name: "WHEN", type: "D", length: 8, decimals: 0 },
      { name: "OK", type: "L", length: 1, decimals: 0 },
      { name: "RATIO", type: "F", length: 12, decimals: 4 },
    ]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("a missing or truncated file gives no fields", () => {
    expect(readDbfFields("/no/such/file.dbf")).toEqual([]);
    const dir = mkdtempSync(path.join(tmpdir(), "dbf-"));
    const file = path.join(dir, "short.dbf");
    writeFileSync(file, Buffer.alloc(10));
    expect(readDbfFields(file)).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("schemaTypeOfDbfField", () => {
  test.each([
    ["C", 0, "String"],
    ["M", 0, "String"],
    ["N", 0, "Number"],
    ["N", 3, "Double"],
    ["F", 0, "Double"],
    ["D", 0, "Date"],
    ["L", 0, "Boolean"],
    ["?", 0, "String"],
  ])("%s with %i decimals is %s", (type, decimals, expected) => {
    expect(schemaTypeOfDbfField(type, decimals)).toBe(expected);
  });
});
