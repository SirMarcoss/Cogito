import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Archive,
  ArrowLeft,
  Box,
  Compass,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
} from "lucide-react";
import { CATANIA_POLE_COORDS } from "../data/mockDataset";
import { getNearbyOpere, IS_MOCK_MODE } from "../services/apiClient";
import type { CategoriaOpera, NearbyResponse, OperaNearbyOut } from "../types/api";
import { CATEGORY_BADGE_STYLES, CATEGORY_LABELS } from "../utils/labels";

export interface MapPageProps {
  onSelectOpera?: (opera: OperaNearbyOut) => void;
}

const CATEGORY_COLOR_HEX: Record<CategoriaOpera, string> = {
  opera: "#c9a86a",
  reperto: "#fbbf24",
  documento: "#34d399",
  monumento: "#38bdf8",
};

const CATEGORY_SHORT_CODE: Record<CategoriaOpera, string> = {
  opera: "OP",
  reperto: "RP",
  documento: "DC",
  monumento: "MN",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createMarkerIcon(item: OperaNearbyOut, isHighlighted: boolean): L.DivIcon {
  const color = CATEGORY_COLOR_HEX[item.categoria];
  const code = CATEGORY_SHORT_CODE[item.categoria];
  const highlightClass = isHighlighted ? "cogito-marker-highlight" : "";
  const size = isHighlighted ? 40 : 32;
  const archiveBadge = item.has_archivio
    ? `<span style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:9999px;background:#e4cc9a;border:2px solid #0b0b0c;"></span>`
    : "";

  return L.divIcon({
    className: "cogito-leaflet-div-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div class="${highlightClass}" style="position:relative;width:${size}px;height:${size}px;border-radius:9999px;background:#141416;border:2.5px solid ${
      isHighlighted ? "#e4cc9a" : color
    };display:flex;align-items:center;justify-content:center;color:${
      isHighlighted ? "#e4cc9a" : "#f3f1ec"
    };font-family:Inter,sans-serif;font-size:${
      isHighlighted ? 11 : 10
    }px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,0.65);">${code}${archiveBadge}</div>`,
  });
}

export function TerritoryMapPage({ onSelectOpera }: MapPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightParam = Number(searchParams.get("highlight"));
  const highlightId =
    Number.isInteger(highlightParam) && highlightParam > 0 ? highlightParam : null;

  const [data, setData] = useState<NearbyResponse | null>(null);
  const [categoria, setCategoria] = useState<CategoriaOpera | undefined>(undefined);
  const [usingFallbackCoords, setUsingFallbackCoords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(highlightId);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerByIdRef = useRef<Map<number, L.Marker>>(new Map());

  const loadNearby = useCallback(
    (lat: number, lng: number, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      getNearbyOpere(
        {
          lat,
          lng,
          radius_km: CATANIA_POLE_COORDS.radiusKm,
          categoria,
        },
        signal,
      )
        .then(setData)
        .catch((err: unknown) => {
          if (signal?.aborted) return;
          setError(
            err instanceof Error ? err.message : "Impossibile caricare i beni vicini.",
          );
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
        loadNearby(CATANIA_POLE_COORDS.lat, CATANIA_POLE_COORDS.lng, signal);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUsingFallbackCoords(false);
          loadNearby(position.coords.latitude, position.coords.longitude, signal);
        },
        () => {
          setUsingFallbackCoords(true);
          loadNearby(CATANIA_POLE_COORDS.lat, CATANIA_POLE_COORDS.lng, signal);
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

  // Inizializzazione mappa Leaflet (compatibile con React 18 StrictMode)
  useEffect(() => {
    const host = mapContainerRef.current;
    if (!host) return;

    const map = L.map(host, {
      center: [CATANIA_POLE_COORDS.lat, CATANIA_POLE_COORDS.lng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = layer;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      markerByIdRef.current.clear();
    };
  }, []);

  // Aggiorna selezione quando arriva ?highlight=
  useEffect(() => {
    if (highlightId) {
      setSelectedId(highlightId);
    }
  }, [highlightId]);

  const selectedOpera = useMemo(() => {
    if (!data?.items.length) return null;
    if (selectedId) {
      const match = data.items.find((item) => item.id === selectedId);
      if (match) return match;
    }
    return data.items[0];
  }, [data, selectedId]);

  // Popola i marker Leaflet
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !data) return;

    layer.clearLayers();
    markerByIdRef.current.clear();

    const activeFocusId = selectedOpera?.id ?? highlightId ?? null;

    data.items.forEach((item) => {
      const isHighlighted = item.id === activeFocusId;
      const marker = L.marker([item.lat, item.lng], {
        icon: createMarkerIcon(item, isHighlighted),
        zIndexOffset: isHighlighted ? 500 : 0,
      });

      const safeTitle = escapeHtml(item.titolo);
      const safeEnte = escapeHtml(item.ente_nome);
      const safeCat = escapeHtml(CATEGORY_LABELS[item.categoria]);
      const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;

      marker.bindPopup(
        `<div style="min-width:210px;font-family:Inter,sans-serif;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.16em;color:#c9a86a;margin-bottom:4px;">${safeCat} • ${item.distance_km} km</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:600;color:#fff;line-height:1.2;margin-bottom:4px;">${safeTitle}</div>
          <div style="font-size:12px;color:#d4d0c8;margin-bottom:10px;">${safeEnte}</div>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:11px;font-weight:600;color:#0b0b0c;background:#c9a86a;padding:5px 10px;border-radius:9999px;text-decoration:none;">Apri con Google Maps</a>
        </div>`,
      );

      marker.on("click", () => {
        setSelectedId(item.id);
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("highlight", String(item.id));
            return next;
          },
          { replace: true },
        );
      });

      marker.addTo(layer);
      markerByIdRef.current.set(item.id, marker);
    });

    if (activeFocusId) {
      const targetMarker = markerByIdRef.current.get(activeFocusId);
      const targetItem = data.items.find((i) => i.id === activeFocusId);
      if (targetMarker && targetItem) {
        map.setView([targetItem.lat, targetItem.lng], 15, { animate: true });
        targetMarker.openPopup();
      }
    } else if (data.items.length > 0) {
      const bounds = L.latLngBounds(data.items.map((item) => [item.lat, item.lng]));
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    }
  }, [data, highlightId, selectedOpera?.id, setSearchParams]);

  const handleFocusItem = (item: OperaNearbyOut) => {
    setSelectedId(item.id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("highlight", String(item.id));
        return next;
      },
      { replace: true },
    );
    const map = mapRef.current;
    const marker = markerByIdRef.current.get(item.id);
    if (map && marker) {
      map.setView([item.lat, item.lng], 16, { animate: true });
      marker.openPopup();
    }
  };

  return (
    <div className="min-h-screen bg-museum-bg text-museum-ink flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#101012]/95 backdrop-blur-md px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/?room=2"
              className="museum-glass hover:border-[#c9a86a]/65 rounded-full px-3.5 py-2 text-xs text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
              <span>Sala II 3D</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#c9a86a]">
                  Beyond the Museum
                </span>
                {IS_MOCK_MODE && (
                  <span className="rounded-full bg-[#c9a86a]/15 border border-[#c9a86a]/40 px-2 py-0.5 text-[10px] text-[#e4cc9a]">
                    Mock
                  </span>
                )}
              </div>
              <h1 className="font-serif-display text-2xl sm:text-3xl text-white leading-none">
                Mappa Culturale del Territorio
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {usingFallbackCoords && (
              <button
                type="button"
                onClick={() => requestUserLocation()}
                className="rounded-full bg-[#c9a86a]/15 hover:bg-[#c9a86a]/25 border border-[#c9a86a]/50 px-3.5 py-2 text-xs font-medium text-[#e4cc9a] inline-flex items-center gap-1.5 transition-colors"
              >
                <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Usa la mia posizione</span>
              </button>
            )}

            <select
              aria-label="Filtra per categoria"
              value={categoria ?? ""}
              onChange={(e) =>
                setCategoria((e.target.value || undefined) as CategoriaOpera | undefined)
              }
              className="rounded-full bg-[#161619] border border-white/20 focus:border-[#c9a86a] px-4 py-2 text-xs text-white"
            >
              <option value="">Tutte le categorie</option>
              <option value="opera">Opere d&apos;arte</option>
              <option value="reperto">Reperti</option>
              <option value="documento">Documenti d&apos;archivio</option>
              <option value="monumento">Monumenti</option>
            </select>

            <Link
              to="/"
              className="rounded-full bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-2 text-xs text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <Box className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
              <span>Hub 3D</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Banner discreto fallback territoriale */}
      {data?.fallback_used && data.fallback_message && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[#c9a86a]/15 border-b border-[#c9a86a]/30 px-4 py-2 text-center text-xs text-[#e4cc9a]"
        >
          {data.fallback_message}
        </div>
      )}

      {/* Layout Principale: Mappa Leaflet + Pannello Elenco/Dettaglio */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        {/* Colonna Mappa */}
        <section
          aria-label="Mappa interattiva OpenStreetMap"
          className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3"
        >
          <div className="relative h-[360px] sm:h-[460px] lg:h-[600px] w-full rounded-2xl overflow-hidden border border-[#c9a86a]/35 shadow-2xl">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Legenda marker */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-300 px-1">
            <span className="text-[#c9a86a] uppercase tracking-[0.16em] font-semibold">
              Legenda:
            </span>
            {(["monumento", "opera", "reperto", "documento"] as CategoriaOpera[]).map(
              (cat) => (
                <span key={cat} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLOR_HEX[cat] }}
                  />
                  <span>{CATEGORY_LABELS[cat]}</span>
                </span>
              ),
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e4cc9a]" />
              <span>Con fonte d&apos;archivio</span>
            </span>
          </div>
        </section>

        {/* Colonna Elenco e Scheda Selezionata */}
        <section
          aria-label="Elenco beni sulla mappa"
          className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 min-h-0"
        >
          {loading && (
            <p aria-busy="true" className="museum-card rounded-2xl p-4 text-sm text-neutral-300">
              Ricerca beni culturali nei dintorni...
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-2xl bg-red-950/45 border border-red-400/35 p-4 text-sm text-red-200">
              {error}
            </p>
          )}

          {/* Scheda evidenza del bene selezionato */}
          {selectedOpera && (
            <article className="museum-glass rounded-2xl border border-[#c9a86a]/50 p-4 sm:p-5 space-y-3 shadow-xl">
              <div className="flex items-start gap-3">
                <img
                  src={selectedOpera.immagine_url}
                  alt={selectedOpera.titolo}
                  className="w-16 h-16 rounded-xl object-cover border border-white/15 shrink-0 bg-neutral-900"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        CATEGORY_BADGE_STYLES[selectedOpera.categoria]
                      }`}
                    >
                      {CATEGORY_LABELS[selectedOpera.categoria]}
                    </span>
                    <span className="text-[11px] text-[#e4cc9a] font-medium">
                      {selectedOpera.distance_km} km
                    </span>
                  </div>
                  <h2 className="font-serif-display text-2xl text-white leading-tight">
                    {selectedOpera.titolo}
                  </h2>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {selectedOpera.ente_nome} • {selectedOpera.anno}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                {selectedOpera.breve_sintesi}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {onSelectOpera ? (
                  <button
                    type="button"
                    onClick={() => onSelectOpera(selectedOpera)}
                    className="rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] text-xs font-semibold px-4 py-2 transition-colors"
                  >
                    Apri scheda 2D
                  </button>
                ) : (
                  <Link
                    to={`/opera/${selectedOpera.id}`}
                    className="rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] text-xs font-semibold px-4 py-2 transition-colors"
                  >
                    Apri scheda 2D
                  </Link>
                )}

                <Link
                  to={`/?room=4&operaId=${selectedOpera.id}`}
                  className="rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium px-3.5 py-2 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
                  <span>Entra nella Sala 3D</span>
                </Link>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOpera.lat},${selectedOpera.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/5 hover:bg-white/10 border border-[#c9a86a]/40 text-[#e4cc9a] text-xs font-medium px-3.5 py-2 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Apri con Google Maps</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>
            </article>
          )}

          {/* Lista scorrevole di tutti i beni */}
          {data && (
            <div className="museum-card rounded-2xl p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e4cc9a]">
                  Beni sul Territorio
                </h2>
                <span className="text-xs text-neutral-300">{data.total} trovati</span>
              </div>

              <ul className="space-y-2 overflow-y-auto custom-scroll max-h-[340px] pr-1">
                {data.items.map((item) => {
                  const isActive = selectedOpera?.id === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleFocusItem(item)}
                        className={`w-full text-left rounded-xl p-3 border transition-all flex items-start justify-between gap-3 ${
                          isActive
                            ? "bg-[#c9a86a]/15 border-[#e4cc9a]"
                            : "bg-white/[0.03] border-white/10 hover:border-[#c9a86a]/55"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <MapPin
                              className="w-3.5 h-3.5 text-[#c9a86a] shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-serif-display text-lg text-white leading-tight truncate">
                              {item.titolo}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 truncate">
                            {item.ente_nome}
                          </p>
                        </div>
                        <div className="shrink-0 text-right space-y-1">
                          <span className="block text-xs font-mono text-[#e4cc9a]">
                            {item.distance_km} km
                          </span>
                          {item.has_archivio && (
                            <span
                              title="Documento d'archivio collegato"
                              className="inline-flex items-center gap-1 text-[10px] text-[#c9a86a]"
                            >
                              <Archive className="w-3 h-3" aria-hidden="true" />
                              Archivio
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default TerritoryMapPage;
