import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Umbral minimo de cobertura para la logica de negocio.
const businessLogicThreshold = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["app/**/*.ts", "src/**/*.ts"],
      exclude: ["**/*.test.ts"],
      reporter: ["text", "html"],
      thresholds: {
        "src/domain/**": businessLogicThreshold,
        "src/lib/**": businessLogicThreshold,
      },
    },
  },
});
