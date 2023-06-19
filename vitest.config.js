import { defineConfig } from "vitest/dist/config";

export default defineConfig({
    test: {
        files: ["./src/**/*.test.js"],
        // Run tests sequentially
        coverage: {
            provider: "istanbul",
        }
    }
});