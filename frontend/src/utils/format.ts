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

const RELATION_TYPE_LABELS: Record<string, string> = {
  evento_storico: "Evento storico condiviso",
  stesso_autore: "Stesso autore o scuola",
  territorio: "Legame territoriale",
  fonte_archivistica: "Fonte archivistica collegata",
  contesto_storico: "Contesto storico",
  affinita_artistica: "Affinità artistica",
  stesso_ente: "Medesimo complesso culturale",
};

export function formatRelationType(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Connessione culturale";
  const key = trimmed.toLowerCase();
  if (RELATION_TYPE_LABELS[key]) {
    return RELATION_TYPE_LABELS[key];
  }
  if (trimmed.includes("_")) {
    const words = trimmed.replace(/_+/g, " ").trim().toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  return trimmed;
}

export function toSafeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Invalid URL
  }
  return null;
}

export function formatDistanceKm(distanceKm: number): string {
  return `a ${distanceKm.toFixed(2)} km`;
}

export function buildGoogleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function safeDecodeUriComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function extractQrCodeFromInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const qrIdx = parts.findIndex((segment) => segment.toLowerCase() === "qr");
      if (qrIdx >= 0) {
        const candidate = parts[qrIdx + 1];
        return candidate ? safeDecodeUriComponent(candidate).trim().toUpperCase() : "";
      }
      const last = parts[parts.length - 1];
      return last ? safeDecodeUriComponent(last).trim().toUpperCase() : "";
    } catch {
      // Fall back to regex/string normalization below
    }
  }

  const qrPrefixMatch = trimmed.match(/\/qr\/([^/?#]*)/i);
  if (qrPrefixMatch) {
    const candidate = qrPrefixMatch[1] ?? "";
    return candidate ? safeDecodeUriComponent(candidate).trim().toUpperCase() : "";
  }

  return trimmed.toUpperCase();
}
