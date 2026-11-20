import type { CategoriaOpera, TipologiaEnte } from "../types/api";

export const CATEGORY_LABELS: Record<CategoriaOpera, string> = {
  opera: "Opera d'arte",
  reperto: "Reperto",
  documento: "Documento d'archivio",
  monumento: "Monumento",
};

export const CATEGORY_BADGE_STYLES: Record<CategoriaOpera, string> = {
  opera: "border-[#c9a86a]/50 bg-[#c9a86a]/15 text-[#e4cc9a]",
  reperto: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  documento: "border-emerald-400/45 bg-emerald-500/15 text-emerald-200",
  monumento: "border-sky-400/45 bg-sky-500/15 text-sky-200",
};

export const ENTITY_TYPE_LABELS: Record<TipologiaEnte, string> = {
  museo: "Museo",
  archivio: "Archivio",
  sito_territorio: "Sito sul territorio",
};

export function formatRelationType(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/^\w/, (ch) => ch.toUpperCase());
}
