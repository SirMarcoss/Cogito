import type {
  ApiErrorResponse,
  AskRequest,
  AskResponse,
  CategoriaOpera,
  CorrelazioniResponse,
  LivelloCompetenza,
  NarrazioneOut,
  NearbyResponse,
  OperaDetailOut,
  OperaListResponse,
} from "../types/api";

const DEFAULT_API_BASE_URL = "/api/v1";

function resolveApiBaseUrl(): string {
  const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const configured = metaEnv?.VITE_API_BASE_URL?.trim();
  if (!configured) {
    return DEFAULT_API_BASE_URL;
  }
  return configured.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Errore HTTP tipizzato restituito dal backend FastAPI di Cogito. */
export class ApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;

  constructor(status: number, errorCode: string, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json; charset=utf-8",
      ...(init?.body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let errorCode = `HTTP_${response.status}`;
    let detail = response.statusText || "Errore durante la comunicazione con il server";

    try {
      const payload = (await response.json()) as Partial<ApiErrorResponse>;
      if (typeof payload.detail === "string") {
        detail = payload.detail;
      }
      if (typeof payload.error_code === "string") {
        errorCode = payload.error_code;
      }
    } catch {
      // Fallback al messaggio HTTP standard se il body non è JSON valido.
    }

    throw new ApiError(response.status, errorCode, detail);
  }

  return (await response.json()) as T;
}

export interface GetOpereParams {
  categoria?: CategoriaOpera;
  ente_id?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GetNearbyOpereParams {
  lat: number;
  lng: number;
  radius_km?: number;
  categoria?: CategoriaOpera;
}

/** GET /api/v1/health — Health check anti cold-start. */
export function checkHealth(signal?: AbortSignal): Promise<{ status: string }> {
  return requestJson<{ status: string }>("/health", { signal });
}

/** GET /api/v1/opere — Catalogo opere con filtri opzionali. */
export function getOpere(
  params: GetOpereParams = {},
  signal?: AbortSignal,
): Promise<OperaListResponse> {
  const query = buildQuery({
    categoria: params.categoria,
    ente_id: params.ente_id,
    search: params.search,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  });
  return requestJson<OperaListResponse>(`/opere${query}`, { signal });
}

/** GET /api/v1/opere/nearby — Ricerca geolocalizzata via Haversine con fallback lato server. */
export function getNearbyOpere(
  params: GetNearbyOpereParams,
  signal?: AbortSignal,
): Promise<NearbyResponse> {
  const query = buildQuery({
    lat: params.lat,
    lng: params.lng,
    radius_km: params.radius_km ?? 20.0,
    categoria: params.categoria,
  });
  return requestJson<NearbyResponse>(`/opere/nearby${query}`, { signal });
}

/** GET /api/v1/opere/{opera_id} — Scheda dettagliata opera + ente + eventuale documento d'archivio. */
export function getOperaById(operaId: number, signal?: AbortSignal): Promise<OperaDetailOut> {
  return requestJson<OperaDetailOut>(`/opere/${operaId}`, { signal });
}

/** GET /api/v1/qr/{qr_code} — Risoluzione deep-link QR (case-insensitive lato server). */
export function resolveQrCode(qrCode: string, signal?: AbortSignal): Promise<OperaDetailOut> {
  return requestJson<OperaDetailOut>(`/qr/${encodeURIComponent(qrCode.trim())}`, { signal });
}

/** GET /api/v1/opere/{opera_id}/narration — Narrazione AI adattiva per livello. */
export function getOperaNarration(
  operaId: number,
  livello: LivelloCompetenza,
  signal?: AbortSignal,
): Promise<NarrazioneOut> {
  const query = buildQuery({ livello });
  return requestJson<NarrazioneOut>(`/opere/${operaId}/narration${query}`, { signal });
}

/** GET /api/v1/opere/{opera_id}/related — Correlazioni culturali/territoriali tra opere. */
export function getRelatedOpere(
  operaId: number,
  limit = 3,
  signal?: AbortSignal,
): Promise<CorrelazioniResponse> {
  const query = buildQuery({ limit });
  return requestJson<CorrelazioniResponse>(`/opere/${operaId}/related${query}`, { signal });
}

/** POST /api/v1/opere/{opera_id}/ask — Q&A contestuale grounded sull'opera. */
export function askOperaQuestion(
  operaId: number,
  payload: AskRequest,
  signal?: AbortSignal,
): Promise<AskResponse> {
  return requestJson<AskResponse>(`/opere/${operaId}/ask`, {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}
