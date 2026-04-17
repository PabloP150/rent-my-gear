import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.tsx"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/date-utils.ts",
        "src/services/inventoryService.ts",
        "src/services/imageService.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
