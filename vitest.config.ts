import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@ascii-graphs/core": fileURLToPath(
        new URL("./packages/core/src/index.ts", import.meta.url),
      ),
      "@ascii-graphs/renderer-ansi": fileURLToPath(
        new URL("./packages/renderer-ansi/src/index.ts", import.meta.url),
      ),
      "@ascii-graphs/renderer-html": fileURLToPath(
        new URL("./packages/renderer-html/src/index.ts", import.meta.url),
      ),
      "@ascii-graphs/renderer-text": fileURLToPath(
        new URL("./packages/renderer-text/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    coverage: { reporter: ["text", "json", "html"] },
    include: ["packages/**/*.test.ts"],
  },
});
