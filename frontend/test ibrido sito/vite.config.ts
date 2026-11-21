import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { neuralTtsPlugin } from "./neuralTtsPlugin.mjs";

export default defineConfig({
  plugins: [react(), neuralTtsPlugin()],
  server: {
    port: 5174,
    proxy: {
      "/api/v1": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5174,
    proxy: {
      "/api/v1": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
