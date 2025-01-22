export class FileProcessor {
  constructor() {
    if (!this.process) {
      throw new Error("process method must be implemented");
    }
  }
}
