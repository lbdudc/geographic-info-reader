import { openSync, readSync, closeSync } from "fs";

/**
 * The field descriptors of a DBF file, with the decimal count the `shapefile` library
 * leaves out (it reads only name, type and length). Needed to tell a whole number from a
 * decimal one: both are DBF type "N".
 *
 * @param {string} dbfPath
 * @returns {{name: string, type: string, length: number, decimals: number}[]}
 *   in file order; empty when the file cannot be read
 */
export function readDbfFields(dbfPath) {
  let fd;
  try {
    fd = openSync(dbfPath, "r");
    const head = Buffer.alloc(32);
    if (readSync(fd, head, 0, 32, 0) < 32) return [];

    // The header holds the 32-byte file header, the 32-byte field descriptors, and 0x0d
    const headerLength = head.readUInt16LE(8);
    const body = Buffer.alloc(Math.max(headerLength - 32, 0));
    readSync(fd, body, 0, body.length, 32);

    const fields = [];
    for (let n = 0; n + 32 <= body.length && body[n] !== 0x0d; n += 32) {
      let end = 0;
      while (end < 11 && body[n + end] !== 0) end++;
      fields.push({
        name: body.toString("latin1", n, n + end),
        type: String.fromCharCode(body[n + 11]),
        length: body[n + 16],
        decimals: body[n + 17],
      });
    }
    return fields;
  } catch {
    return [];
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/**
 * The schema type of a DBF field: what the generated application stores it as.
 * Text (and anything unknown, memo included) stays a String.
 *
 * @param {string} dbfType DBF field type letter (C, N, F, D, L, M...)
 * @param {number} [decimals] decimal count of a numeric field
 * @returns {"String"|"Number"|"Double"|"Date"|"Boolean"}
 */
export function schemaTypeOfDbfField(dbfType, decimals = 0) {
  switch (dbfType) {
    case "N":
    case "B":
      return decimals > 0 ? "Double" : "Number";
    case "F":
      return "Double";
    case "D":
      return "Date";
    case "L":
      return "Boolean";
    default:
      return "String";
  }
}
