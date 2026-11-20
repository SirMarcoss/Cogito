import { useCallback, useEffect, useState } from "react";
import { getNearbyOpere } from "../services/apiClient";
import type { CategoriaOpera, NearbyResponse, OperaNearbyOut } from "../types/api";

/** Coordinate di fallback del polo culturale di default (Catania). */
const DEFAULT_POLE_COORDS = {
  lat: 37.5079,
  lng: 15.083,
  radiusKm: 20,
} as const;

export interface MapPageProps {
  onSelectOpera?: (opera: OperaNearbyOut) => void;
}

/**
 * Template pagina Mappa Territoriale (`/map`).
 * Connette fisicamente e narrativamente le opere nei musei ai luoghi storici del territorio.
 *
 * Regole da specifica (`docs/FRONTEND_CONTEXT.md`):
 * - All'apertura chiama `navigator.geolocation.getCurrentPosition(..., { timeout: 5000 })`.
 * - In caso di rifiuto o timeout usa le coordinate di default (`37.5079, 15.0830`)
 *   mostrando il pulsante `"Usa la mia posizione"`.
 * - Se `fallback_used === true`, mostra il banner discreto con `fallback_message`.
 *
 * TODO (UI Implementation):
 * - Integrare Leaflet / OpenStreetMap con marker differenziati per `categoria` e `has_archivio`
 * - Integrare modale/pannello in stile `museum-glass` ispirato alla planimetria di Palazzo Aurelia
 */
export function TerritoryMapPage({ onSelectOpera }: MapPageProps) {
  const [data, setData] = useState<NearbyResponse | null>(null);
  const [categoria, setCategoria] = useState<CategoriaOpera | undefined>(undefined);
  const [usingFallbackCoords, setUsingFallbackCoords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNearby = useCallback(
    (lat: number, lng: number, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      getNearbyOpere(
        {
          lat,
          lng,
          radius_km: DEFAULT_POLE_COORDS.radiusKm,
          categoria,
        },
        signal,
      )
        .then(setData)
        .catch((err: unknown) => {
          if (signal?.aborted) return;
          setError(err instanceof Error ? err.message : "Impossibile caricare i beni vicini.");
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [categoria],
  );

  const requestUserLocation = useCallback(
    (signal?: AbortSignal) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        setUsingFallbackCoords(true);
        loadNearby(DEFAULT_POLE_COORDS.lat, DEFAULT_POLE_COORDS.lng, signal);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUsingFallbackCoords(false);
          loadNearby(position.coords.latitude, position.coords.longitude, signal);
        },
        () => {
          setUsingFallbackCoords(true);
          loadNearby(DEFAULT_POLE_COORDS.lat, DEFAULT_POLE_COORDS.lng, signal);
        },
        { timeout: 5000 },
      );
    },
    [loadNearby],
  );

  useEffect(() => {
    const controller = new AbortController();
    requestUserLocation(controller.signal);
    return () => controller.abort();
  }, [requestUserLocation]);

  return (
    <main>
      <header>
        <h1>Mappa Culturale — Beyond the Museum</h1>
        {usingFallbackCoords && (
          <button type="button" onClick={() => requestUserLocation()}>
            Usa la mia posizione
          </button>
        )}
        <select
          aria-label="Filtra per categoria"
          value={categoria ?? ""}
          onChange={(e) =>
            setCategoria((e.target.value || undefined) as CategoriaOpera | undefined)
          }
        >
          <option value="">Tutte le categorie</option>
          <option value="opera">Opere</option>
          <option value="reperto">Reperti</option>
          <option value="documento">Documenti d&apos;archivio</option>
          <option value="monumento">Monumenti</option>
        </select>
      </header>

      {data?.fallback_used && data.fallback_message && (
        <div role="status" aria-live="polite">
          {data.fallback_message}
        </div>
      )}

      {loading && <p aria-busy="true">Ricerca beni culturali nei dintorni...</p>}
      {error && <p role="alert">{error}</p>}

      {data && (
        <section aria-label="Elenco beni sulla mappa">
          <p>{data.total} beni trovati</p>
          <ul>
            {data.items.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onSelectOpera?.(item)}>
                  {item.titolo} — {item.ente_nome} ({item.distance_km} km)
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default TerritoryMapPage;
