import type {
  CategoriaOpera,
  LivelloCompetenza,
  TipologiaEnte,
} from "../types/api";

export const CATEGORIA_LABELS: Record<CategoriaOpera, string> = {
  opera: "Opera",
  reperto: "Reperto",
  documento: "Documento",
  monumento: "Monumento",
};

export const TIPOLOGIA_ENTE_LABELS: Record<TipologiaEnte, string> = {
  museo: "Museo",
  archivio: "Archivio Storico",
  sito_territorio: "Sito sul Territorio",
};

export interface LevelMetadata {
  id: LivelloCompetenza;
  label: string;
  subtitle: string;
  description: string;
}

export const LEVEL_OPTIONS: LevelMetadata[] = [
  {
    id: "bambino",
    label: "Bambino",
    subtitle: "6–11 anni",
    description: "Storytelling semplice, immagini evocative e curiosità.",
  },
  {
    id: "ragazzo",
    label: "Ragazzo",
    subtitle: "12–17 anni",
    description: "Tono diretto, dinamico e collegamenti con il presente.",
  },
  {
    id: "adulto",
    label: "Adulto",
    subtitle: "Percorso culturale",
    description: "Narrazione culturale equilibrata tra storia, arte e contesto.",
  },
  {
    id: "esperto",
    label: "Esperto",
    subtitle: "Ricerca & Archivio",
    description: "Rigore storico, terminologia tecnica e metadati archivistici.",
  },
];

export const LEVEL_LABELS: Record<LivelloCompetenza, string> = {
  bambino: "Bambino",
  ragazzo: "Ragazzo",
  adulto: "Adulto",
  esperto: "Esperto",
};

export function formatDistanceKm(distanceKm: number): string {
  return `a ${distanceKm.toFixed(2)} km`;
}

export function buildGoogleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function extractQrCodeFromInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const parsed = new URL(trimmed);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const qrIdx = parts.findIndex((segment) => segment.toLowerCase() === "qr");
      if (qrIdx >= 0 && parts[qrIdx + 1]) {
        return decodeURIComponent(parts[qrIdx + 1]).trim().toUpperCase();
      }
      const last = parts[parts.length - 1];
      if (last) return decodeURIComponent(last).trim().toUpperCase();
    }
  } catch {
    // Fall back to direct string normalization below
  }

  const qrPrefixMatch = trimmed.match(/\/qr\/([^/?#]+)/i);
  if (qrPrefixMatch?.[1]) {
    return decodeURIComponent(qrPrefixMatch[1]).trim().toUpperCase();
  }

  return trimmed.toUpperCase();
}
