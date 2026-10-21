/// <reference types="vitest" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site is served from /<repo>/.
// Override with BASE_PATH env when the repo name differs.
const base = process.env.BASE_PATH ?? "/vibe-marathon/";

const dataDir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  base,
  plugins: [react()],
  // Pages import the plan JSON from ../data at build time, so every data
  // push to main redeploys the site with fresh numbers.
  server: { fs: { allow: [".."] } },
  resolve: { alias: { "@data": dataDir("../data") } },
  test: {
    // Tests read a frozen copy of the data, so the nightly syncs never break
    // them. src/lib/data.test.ts checks the real data/ files.
    alias: { "@data": dataDir("./src/test/fixtures") },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
