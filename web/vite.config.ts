/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site is served from /<repo>/.
// Override with BASE_PATH env when the repo name differs.
const base = process.env.BASE_PATH ?? "/vibe-marathon/";

export default defineConfig({
  base,
  plugins: [react()],
  // Pages import the plan JSON from ../data at build time, so every data
  // push to main redeploys the site with fresh numbers.
  server: { fs: { allow: [".."] } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
