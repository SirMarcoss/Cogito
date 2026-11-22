import { createLogger, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { neuralTtsPlugin } from "./neuralTtsPlugin.mjs";

const baseLogger = createLogger();
const customLogger = {
  ...baseLogger,
  error(msg: string, options?: Parameters<typeof baseLogger.error>[1]) {
    const errText =
      options?.error instanceof Error
        ? `${options.error.message} ${options.error.stack ?? ""}`
        : String(options?.error ?? "");
    if (
      msg.includes("http proxy error:") &&
      msg.includes("/api/v1") &&
      (msg.includes("ECONNREFUSED") || errText.includes("ECONNREFUSED"))
    ) {
      return;
    }
    baseLogger.error(msg, options);
  },
};

export default defineConfig({
  customLogger,
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
