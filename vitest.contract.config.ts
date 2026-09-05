import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/contract/**/*.spec.ts"],
    hookTimeout: 30000,
    testTimeout: 30000,
    reporters: ["default"],
  },
});
