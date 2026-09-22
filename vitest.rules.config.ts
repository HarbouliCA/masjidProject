import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Rules tests require the Firestore emulator and are run separately:
 *   npm run test:rules
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
