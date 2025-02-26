export class FileProcessor {
  async process(filePath, options) {
    throw new Error("process method must be implemented");
  }

  open() {
    throw new Error("open method must be implemented");
  }

  getSchemaFields() {
    throw new Error("getSchemaFields method must be implemented");
  }

  getGeographicInfo() {
    throw new Error("getGeographicInfo method must be implemented");
  }

  getFileType() {
    throw new Error("getFileType method must be implemented");
  }

  shouldZip() {
    throw new Error("shouldZip method must be implemented");
  }
}
