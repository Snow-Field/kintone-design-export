import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./public/manifest.json";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react(), crx({ manifest })],
  build: {
    chunkSizeWarningLimit: 2000,
  },
  resolve: {
    alias: [{ find: "@/", replacement: `${__dirname}/src/` }],
  },
});
