import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/**/*.test.ts"],
    testTimeout: 30000, // integration test builds a project — needs extra time
    hookTimeout: 30000,
  },
});
