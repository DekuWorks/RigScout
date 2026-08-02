/// <reference types="vitest/config" />
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/**
 * Vite base path supports:
 * - GitHub project pages: VITE_BASE_PATH=/RigScout/
 * - Custom domain / local: VITE_BASE_PATH=/
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "");
  const base = env.VITE_BASE_PATH || "/";

  return {
    base,
    plugins: [react(), tailwindcss()],
    envDir: path.resolve(__dirname, "../.."),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@rigscout/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      globals: true,
    },
  };
});
