import {
  CATANIA_POLE_COORDS,
  MOCK_CORRELAZIONI,
  MOCK_NARRAZIONI,
  MOCK_OPERE,
  toOperaSummary,
} from "../data/mockDataset";
import type {
  AskRequest,
  AskResponse,
  CategoriaOpera,
  CorrelazioniResponse,
  LivelloCompetenza,
  NarrazioneOut,
  NearbyResponse,
  OperaDetailOut,
  OperaListResponse,
  OperaNearbyOut,
} from "../types/api";
import { ApiError } from "./apiError";

export interface MockGetOpereParams {
  categoria?: CategoriaOpera;
  ente_id?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MockGetNearbyParams {
  lat: number;
  lng: number;
  radius_km?: number;
  categoria?: CategoriaOpera;
}

function waitWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException("Richiesta annullata", "AbortError"));
  }
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Richiesta annullata", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export async function mockCheckHealth(signal?: AbortSignal): Promise<{ status: string }> {
  await waitWithAbort(50, signal);
  return { status: "ok" };
}

export async function mockGetOpere(
  params: MockGetOpereParams = {},
  signal?: AbortSignal,
): Promise<OperaListResponse> {
  await waitWithAbort(110, signal);

  const searchTerm = params.search?.trim().toLowerCase() ?? "";
  const filtered = MOCK_OPERE.filter((opera) => {
    if (params.categoria && opera.categoria !== params.categoria) {
      return false;
    }
    if (params.ente_id !== undefined && opera.ente_id !== params.ente_id) {
      return false;
    }
    if (searchTerm) {
      const haystack = [
        opera.titolo,
        opera.autore,
        opera.breve_sintesi,
        opera.ente_nome,
        opera.qr_code,
        opera.anno,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(searchTerm)) {
        return false;
      }
    }
    return true;
  });

  const offset = Math.max(0, params.offset ?? 0);
  const limit = Math.max(1, params.limit ?? 50);
  const sliced = filtered.slice(offset, offset + limit).map(toOperaSummary);

  return {
    total: filtered.length,
    items: sliced,
  };
}

export async function mockGetNearbyOpere(
  params: MockGetNearbyParams,
  signal?: AbortSignal,
): Promise<NearbyResponse> {
  await waitWithAbort(120, signal);

  const radius = params.radius_km ?? CATANIA_POLE_COORDS.radiusKm;
  const baseOpere = MOCK_OPERE.filter(
    (opera) => !params.categoria || opera.categoria === params.categoria,
  );

  const withinRadius: OperaNearbyOut[] = baseOpere
    .map((opera) => ({
      ...toOperaSummary(opera),
      distance_km: haversineKm(params.lat, params.lng, opera.lat, opera.lng),
    }))
    .filter((item) => item.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km);

  if (withinRadius.length > 0) {
    return {
      user_lat: params.lat,
      user_lng: params.lng,
      radius_km: radius,
      fallback_used: false,
      fallback_message: null,
      total: withinRadius.length,
      items: withinRadius,
    };
  }

  const poleItems: OperaNearbyOut[] = baseOpere
    .map((opera) => ({
      ...toOperaSummary(opera),
      distance_km: haversineKm(
        CATANIA_POLE_COORDS.lat,
        CATANIA_POLE_COORDS.lng,
        opera.lat,
        opera.lng,
      ),
    }))
    .sort((a, b) => a.distance_km - b.distance_km);

  return {
    user_lat: CATANIA_POLE_COORDS.lat,
    user_lng: CATANIA_POLE_COORDS.lng,
    radius_km: radius,
    fallback_used: true,
    fallback_message: `Nessuna opera entro ${radius} km — stai esplorando il polo di Catania`,
    total: poleItems.length,
    items: poleItems,
  };
}

export async function mockGetOperaById(
  operaId: number,
  signal?: AbortSignal,
): Promise<OperaDetailOut> {
  await waitWithAbort(95, signal);
  const found = MOCK_OPERE.find((opera) => opera.id === operaId);
  if (!found) {
    throw new ApiError(404, "OPERA_NOT_FOUND", "Opera o codice QR non trovato");
  }
  return found;
}

export async function mockResolveQrCode(
  qrCode: string,
  signal?: AbortSignal,
): Promise<OperaDetailOut> {
  await waitWithAbort(105, signal);
  const normalized = qrCode.trim().toLowerCase();
  const found = MOCK_OPERE.find((opera) => opera.qr_code.toLowerCase() === normalized);
  if (!found) {
    throw new ApiError(404, "QR_NOT_FOUND", "Opera o codice QR non trovato");
  }
  return found;
}

export async function mockGetOperaNarration(
  operaId: number,
  livello: LivelloCompetenza,
  signal?: AbortSignal,
): Promise<NarrazioneOut> {
  await waitWithAbort(340, signal);
  const byOpera = MOCK_NARRAZIONI[operaId];
  const narration = byOpera?.[livello];
  if (!narration) {
    throw new ApiError(404, "OPERA_NOT_FOUND", "Narrazione non trovata per l'opera richiesta");
  }
  return narration;
}

export async function mockGetRelatedOpere(
  operaId: number,
  limit = 3,
  signal?: AbortSignal,
): Promise<CorrelazioniResponse> {
  await waitWithAbort(320, signal);
  const found = MOCK_OPERE.find((opera) => opera.id === operaId);
  if (!found) {
    throw new ApiError(404, "OPERA_NOT_FOUND", "Opera non trovata");
  }
  const items = (MOCK_CORRELAZIONI[operaId] ?? []).slice(0, Math.max(1, limit));
  return {
    opera_sorgente_id: operaId,
    from_cache: true,
    correlazioni: items,
  };
}

const DOMAIN_KEYWORDS = [
  "opera",
  "autore",
  "artista",
  "storia",
  "storico",
  "anno",
  "secolo",
  "quando",
  "dove",
  "museo",
  "archivio",
  "documento",
  "segnatura",
  "fondo",
  "catania",
  "etna",
  "lava",
  "1669",
  "1693",
  "castello",
  "ursino",
  "federico",
  "svevia",
  "riccardo",
  "lentini",
  "portale",
  "marmo",
  "statua",
  "torso",
  "imperatore",
  "romano",
  "biscari",
  "agata",
  "quadro",
  "tela",
  "dipinto",
  "pittore",
  "lanfranco",
  "barocco",
  "mappa",
  "pianta",
  "colata",
  "anfiteatro",
  "stesicoro",
  "arena",
  "pietra",
  "basalto",
  "bellini",
  "norma",
  "partitura",
  "musica",
  "manoscritto",
  "chiostro",
  "monastero",
  "benedettini",
  "vaccarini",
  "architettura",
  "restauro",
  "sala",
  "materiale",
  "tecnica",
  "perche",
  "perché",
  "come",
  "chi",
  "significato",
  "simbolo",
  "aquila",
  "corazza",
  "origine",
  "scavi",
];

const OFF_TOPIC_KEYWORDS = [
  "meteo",
  "piove",
  "tempo fa",
  "ricetta",
  "pasta",
  "pizza",
  "calcio",
  "partita",
  "risultato",
  "borsa",
  "bitcoin",
  "crypto",
  "codice",
  "javascript",
  "python",
  "oroscopo",
  "film",
  "canzone pop",
];

function isQuestionInScope(question: string, opera: OperaDetailOut): boolean {
  const lower = question.toLowerCase();
  if (OFF_TOPIC_KEYWORDS.some((kw) => lower.includes(kw))) {
    return false;
  }

  const operaTokens = [
    opera.titolo,
    opera.autore,
    opera.ente_nome,
    opera.anno,
    opera.categoria,
    opera.documento_archivio?.segnatura ?? "",
    opera.documento_archivio?.fondo ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .split(/[^a-zàèéìòù0-9]+/)
    .filter((token) => token.length >= 4);

  return (
    DOMAIN_KEYWORDS.some((kw) => lower.includes(kw)) ||
    operaTokens.some((token) => lower.includes(token))
  );
}

export async function mockAskOperaQuestion(
  operaId: number,
  payload: AskRequest,
  signal?: AbortSignal,
): Promise<AskResponse> {
  await waitWithAbort(360, signal);

  const trimmed = payload.question.trim();
  if (trimmed.length < 3 || trimmed.length > 300) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "La domanda deve contenere tra 3 e 300 caratteri.",
    );
  }

  const opera = MOCK_OPERE.find((item) => item.id === operaId);
  if (!opera) {
    throw new ApiError(404, "OPERA_NOT_FOUND", "Opera non trovata");
  }

  if (!isQuestionInScope(trimmed, opera)) {
    return {
      opera_id: operaId,
      answer: `La tua domanda non riguarda direttamente "${opera.titolo}" né il suo contesto storico o archivistico. Posso aiutarti con dettagli sull'autore (${opera.autore}), la datazione (${opera.anno}), i materiali, l'ente di conservazione o le fonti d'archivio collegate.`,
      in_scope: false,
      fonti_citate: [],
    };
  }

  const archiveRef = opera.documento_archivio
    ? ` Inoltre, la fonte d'archivio ${opera.documento_archivio.segnatura} (${opera.documento_archivio.fondo}) conferma: "${opera.documento_archivio.estratto_verificato}"`
    : " Per questo bene non è presente un singolo documento d'archivio collegato, quindi la risposta si basa esclusivamente sulla scheda storico-monumentale verificata.";

  const fonti = [opera.ente.nome];
  if (opera.documento_archivio) {
    fonti.push(`${opera.documento_archivio.ente_conservazione} — ${opera.documento_archivio.segnatura}`);
  }

  let answer = "";
  if (payload.livello === "bambino") {
    answer = `Ottima curiosità su "${opera.titolo}"! Questo bene risale al periodo ${opera.anno} ed è collegato a ${opera.autore}. Oggi si trova presso ${opera.ente.nome} a ${opera.ente.citta}. ${opera.breve_sintesi}${opera.documento_archivio ? " Un vecchio documento conservato in archivio aiuta gli studiosi a raccontarne la storia vera!" : ""}`;
  } else if (payload.livello === "ragazzo") {
    answer = `In merito alla tua domanda su "${opera.titolo}" (${opera.anno}, ${opera.autore}): ${opera.breve_sintesi} Puoi approfondirlo presso ${opera.ente.nome}.${archiveRef}`;
  } else if (payload.livello === "esperto") {
    answer = `Risposta basata su fonti verificate per "${opera.titolo}" (${opera.autore}, ${opera.anno}, sede: ${opera.ente.nome}): ${opera.descrizione_ufficiale}${archiveRef}`;
  } else {
    answer = `Su "${opera.titolo}" (${opera.autore}, ${opera.anno}): ${opera.descrizione_ufficiale}${archiveRef}`;
  }

  return {
    opera_id: operaId,
    answer,
    in_scope: true,
    fonti_citate: fonti,
  };
}
