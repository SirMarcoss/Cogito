/// <reference types="vite/client" />

declare module "*.mjs" {
  import type { Plugin } from "vite";
  export function neuralTtsPlugin(): Plugin;
}
