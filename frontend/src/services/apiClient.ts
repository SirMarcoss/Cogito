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

export { ApiError, isApiError } from "./apiError";

const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api/v1"
).replace(/\/$/, "");

function formatValidationDetail(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg?: unknown }).msg ?? "").trim();
        }
        return "";
      })
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join("; ");
    }
  }
  return null;
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as Partial<ApiErrorResponse> & {
        detail?: unknown;
      };
      const parsedDetail =
        formatValidationDetail(data.detail) ??
        (res.statusText || "Errore di comunicazione con il server.");
      return new ApiError(
        res.status,
        data.error_code ?? `HTTP_${res.status}`,
        parsedDetail,
      );
    }
  } catch {
    // Fall through to generic ApiError
  }
  return new ApiError(
    res.status,
    `HTTP_${res.status}`,
    res.statusText || "Errore server.",
  );
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

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    signal?: AbortSignal;
    timeoutMs?: number;
  },
): Promise<T> {
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const timeoutMs = options.timeoutMs ?? 12000;
  const { signal, cleanup } = mergeAbortSignals(options.signal, timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal,
    });

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiError(
        502,
        "INVALID_RESPONSE",
        "Risposta non valida dal server Cogito.",
      );
    }

    return (await res.json()) as T;
  } catch (err) {
    if (options.signal?.aborted) {
      throw err instanceof Error ? err : new DOMException("Aborted", "AbortError");
    }
    if (err instanceof ApiError) {
      throw err;
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

  return request(`/opere?${sp.toString()}`, { method: "GET", signal });
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

  return request(`/opere/nearby?${sp.toString()}`, { method: "GET", signal });
}

export function fetchOperaById(
  operaId: number,
  signal?: AbortSignal,
): Promise<OperaDetailOut> {
  return request(`/opere/${operaId}`, { method: "GET", signal });
}

export function fetchOperaByQr(
  qrCode: string,
  signal?: AbortSignal,
): Promise<OperaDetailOut> {
  const normalized = qrCode.trim().toUpperCase();
  return request(`/qr/${encodeURIComponent(normalized)}`, {
    method: "GET",
    signal,
  });
}

export function fetchOperaNarration(
  operaId: number,
  livello: LivelloCompetenza,
  signal?: AbortSignal,
): Promise<NarrazioneOut> {
  const sp = new URLSearchParams({ livello });
  return request(`/opere/${operaId}/narration?${sp.toString()}`, {
    method: "GET",
    signal,
    timeoutMs: 20000,
  });
}

export function fetchOperaRelated(
  operaId: number,
  limit = 3,
  signal?: AbortSignal,
): Promise<CorrelazioniResponse> {
  const sp = new URLSearchParams({ limit: String(limit) });
  return request(`/opere/${operaId}/related?${sp.toString()}`, {
    method: "GET",
    signal,
    timeoutMs: 20000,
  });
}

export function askOperaQuestion(
  operaId: number,
  payload: AskRequest,
  signal?: AbortSignal,
): Promise<AskResponse> {
  return request(`/opere/${operaId}/ask`, {
    method: "POST",
    body: payload,
    signal,
    timeoutMs: 20000,
  });
}
