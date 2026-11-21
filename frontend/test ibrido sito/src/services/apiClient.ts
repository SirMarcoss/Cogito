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
import { ApiError } from "./apiError";
import {
  mockAskOperaQuestion,
  mockFetchNearbyOpere,
  mockFetchOperaById,
  mockFetchOperaByQr,
  mockFetchOperaNarration,
  mockFetchOperaRelated,
  mockFetchOpere,
} from "./mockData";

export { ApiError, isApiError } from "./apiError";

const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api/v1"
).replace(/\/$/, "");

type DataMode = "auto" | "live" | "mock";

function resolveInitialMode(): DataMode {
  const flag = (import.meta.env.VITE_USE_MOCK as string | undefined)?.toLowerCase().trim();
  if (flag === "true") return "mock";
  if (flag === "false") return "live";
  return "auto";
}

const INITIAL_MODE: DataMode = resolveInitialMode();
let mockFallbackUntil = 0;
const FALLBACK_COOLDOWN_MS = 30000;

async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as Partial<ApiErrorResponse>;
      return new ApiError(
        res.status,
        data.error_code ?? `HTTP_${res.status}`,
        data.detail ?? res.statusText ?? "Errore di comunicazione con il server.",
      );
    }
  } catch {
    // Fall through to generic ApiError
  }
  return new ApiError(res.status, `HTTP_${res.status}`, res.statusText || "Errore server.");
}

function mergeAbortSignals(
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = window.setTimeout(() => {
    controller.abort(new DOMException("Request timeout", "TimeoutError"));
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timer);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    },
  };
}

async function requestWithFallback<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    signal?: AbortSignal;
    timeoutMs?: number;
  },
  mockFn: () => Promise<T>,
): Promise<T> {
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (INITIAL_MODE === "mock") {
    return mockFn();
  }

  if (INITIAL_MODE === "auto" && Date.now() < mockFallbackUntil) {
    return mockFn();
  }

  const timeoutMs = options.timeoutMs ?? (INITIAL_MODE === "auto" ? 2000 : 12000);
  const { signal, cleanup } = mergeAbortSignals(options.signal, timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal,
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (INITIAL_MODE === "auto") {
      // Only treat non-JSON proxy errors (e.g. Vite proxy ECONNREFUSED 500/502/504) as unreachable backend.
      if (!isJson && !res.ok) {
        mockFallbackUntil = Date.now() + FALLBACK_COOLDOWN_MS;
        return mockFn();
      }
      if (isJson) {
        mockFallbackUntil = 0;
      }
    }

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (options.signal?.aborted) {
      throw err instanceof Error ? err : new DOMException("Aborted", "AbortError");
    }
    if (err instanceof ApiError) {
      throw err;
    }
    if (INITIAL_MODE === "auto") {
      mockFallbackUntil = Date.now() + FALLBACK_COOLDOWN_MS;
      return mockFn();
    }
    throw new ApiError(
      503,
      "NETWORK_ERROR",
      "Impossibile raggiungere il server Cogito in questo momento.",
    );
  } finally {
    cleanup();
  }
}

export function fetchOpere(
  params?: {
    search?: string;
    categoria?: CategoriaOpera | null;
    ente_id?: number | null;
    limit?: number;
    offset?: number;
  },
  signal?: AbortSignal,
): Promise<OperaListResponse> {
  const sp = new URLSearchParams();
  if (params?.search?.trim()) sp.set("search", params.search.trim());
  if (params?.categoria) sp.set("categoria", params.categoria);
  if (params?.ente_id !== undefined && params?.ente_id !== null) {
    sp.set("ente_id", String(params.ente_id));
  }
  sp.set("limit", String(params?.limit ?? 50));
  sp.set("offset", String(params?.offset ?? 0));

  return requestWithFallback(
    `/opere?${sp.toString()}`,
    { method: "GET", signal },
    () => mockFetchOpere(params),
  );
}

export function fetchNearbyOpere(
  params: {
    lat: number;
    lng: number;
    radius_km?: number;
    categoria?: CategoriaOpera | null;
  },
  signal?: AbortSignal,
): Promise<NearbyResponse> {
  const sp = new URLSearchParams();
  sp.set("lat", String(params.lat));
  sp.set("lng", String(params.lng));
  sp.set("radius_km", String(params.radius_km ?? 20));
  if (params.categoria) sp.set("categoria", params.categoria);

  return requestWithFallback(
    `/opere/nearby?${sp.toString()}`,
    { method: "GET", signal },
    () => mockFetchNearbyOpere(params),
  );
}

export function fetchOperaById(
  operaId: number,
  signal?: AbortSignal,
): Promise<OperaDetailOut> {
  return requestWithFallback(
    `/opere/${operaId}`,
    { method: "GET", signal },
    () => mockFetchOperaById(operaId),
  );
}

export function fetchOperaByQr(
  qrCode: string,
  signal?: AbortSignal,
): Promise<OperaDetailOut> {
  const normalized = qrCode.trim().toUpperCase();
  return requestWithFallback(
    `/qr/${encodeURIComponent(normalized)}`,
    { method: "GET", signal },
    () => mockFetchOperaByQr(normalized),
  );
}

export function fetchOperaNarration(
  operaId: number,
  livello: LivelloCompetenza,
  signal?: AbortSignal,
): Promise<NarrazioneOut> {
  const sp = new URLSearchParams({ livello });
  return requestWithFallback(
    `/opere/${operaId}/narration?${sp.toString()}`,
    { method: "GET", signal, timeoutMs: 14000 },
    () => mockFetchOperaNarration(operaId, livello, signal),
  );
}

export function fetchOperaRelated(
  operaId: number,
  limit = 3,
  signal?: AbortSignal,
): Promise<CorrelazioniResponse> {
  const sp = new URLSearchParams({ limit: String(limit) });
  return requestWithFallback(
    `/opere/${operaId}/related?${sp.toString()}`,
    { method: "GET", signal, timeoutMs: 12000 },
    () => mockFetchOperaRelated(operaId, limit, signal),
  );
}

export function askOperaQuestion(
  operaId: number,
  payload: AskRequest,
  signal?: AbortSignal,
): Promise<AskResponse> {
  return requestWithFallback(
    `/opere/${operaId}/ask`,
    { method: "POST", body: payload, signal, timeoutMs: 15000 },
    () => mockAskOperaQuestion(operaId, payload),
  );
}
