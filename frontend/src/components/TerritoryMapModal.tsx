import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Archive,
  Box,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
} from "lucide-react";
import { CATANIA_POLE_COORDS } from "../data/mockDataset";
import { getNearbyOpere } from "../services/apiClient";
import type { CategoriaOpera, NearbyResponse, OperaNearbyOut } from "../types/api";
import { CATEGORY_BADGE_STYLES, CATEGORY_LABELS } from "../utils/labels";

export interface TerritoryMapPanelProps {
  highlightOperaId?: number | null;
  onEnterSala4: (operaId: number) => void;
  onOpen2DOpera?: (operaId: number) => void;
}

const CATEGORY_COLOR_HEX: Record<CategoriaOpera, string> = {
  opera: "#c9a86a",
  reperto: "#d97706",
  documento: "#059669",
  monumento: "#0284c7",
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

/** Pannello Mappa Territoriale Leaflet riutilizzabile all'interno del modale senza uscire dall'Hub 3D. */
export function TerritoryMapPanel({
  highlightOperaId = null,
  onEnterSala4,
  onOpen2DOpera,
}: TerritoryMapPanelProps) {
  const [data, setData] = useState<NearbyResponse | null>(null);
  const [categoria, setCategoria] = useState<CategoriaOpera | undefined>(undefined);
  const [usingFallbackCoords, setUsingFallbackCoords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(highlightOperaId);

  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<number, L.Marker>>(new Map());

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
        (pos) => {
          setUsingFallbackCoords(false);
          loadNearby(pos.coords.latitude, pos.coords.longitude, signal);
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

  useEffect(() => {
    if (highlightOperaId) {
      setSelectedId(highlightOperaId);
    }
  }, [highlightOperaId]);

  useEffect(() => {
    const host = mapHostRef.current;
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
    layerRef.current = layer;

    const sizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 80);

    return () => {
      window.clearTimeout(sizeTimer);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markerMapRef.current.clear();
    };
  }, []);

  const selectedOpera = useMemo(() => {
    if (!data?.items.length) return null;
    if (selectedId) {
      const match = data.items.find((item) => item.id === selectedId);
      if (match) return match;
    }
    return data.items[0];
  }, [data, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !data) return;

    layer.clearLayers();
    markerMapRef.current.clear();

    const activeId = selectedOpera?.id ?? highlightOperaId ?? null;

    data.items.forEach((item) => {
      const isHighlighted = item.id === activeId;
      const marker = L.marker([item.lat, item.lng], {
        icon: createMarkerIcon(item, isHighlighted),
        zIndexOffset: isHighlighted ? 500 : 0,
      });

      const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;
      marker.bindPopup(
        `<div style="min-width:200px;font-family:Inter,sans-serif;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.16em;color:#c9a86a;margin-bottom:4px;">${escapeHtml(CATEGORY_LABELS[item.categoria])} • ${item.distance_km} km</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:600;color:#fff;line-height:1.2;margin-bottom:4px;">${escapeHtml(item.titolo)}</div>
          <div style="font-size:12px;color:#d4d0c8;margin-bottom:10px;">${escapeHtml(item.ente_nome)}</div>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:11px;font-weight:600;color:#0b0b0c;background:#c9a86a;padding:5px 10px;border-radius:9999px;text-decoration:none;">Apri con Google Maps</a>
        </div>`,
      );

      marker.on("click", () => {
        setSelectedId(item.id);
      });

      marker.addTo(layer);
      markerMapRef.current.set(item.id, marker);
    });

    if (activeId) {
      const targetMarker = markerMapRef.current.get(activeId);
      const targetItem = data.items.find((i) => i.id === activeId);
      if (targetMarker && targetItem) {
        map.setView([targetItem.lat, targetItem.lng], 15, { animate: true });
        targetMarker.openPopup();
      }
    }
  }, [data, highlightOperaId, selectedOpera?.id]);

  const handleFocusItem = (item: OperaNearbyOut) => {
    setSelectedId(item.id);
    const map = mapRef.current;
    const marker = markerMapRef.current.get(item.id);
    if (map && marker) {
      map.setView([item.lat, item.lng], 16, { animate: true });
      marker.openPopup();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filtra mappa per categoria"
            value={categoria ?? ""}
            onChange={(e) =>
              setCategoria((e.target.value || undefined) as CategoriaOpera | undefined)
            }
            className="rounded-full bg-[#fbf7ef] border border-[#b89352]/50 px-3.5 py-1.5 text-xs text-[#221a12]"
          >
            <option value="">Tutte le categorie</option>
            <option value="opera">Opere d&apos;arte</option>
            <option value="reperto">Reperti</option>
            <option value="documento">Documenti d&apos;archivio</option>
            <option value="monumento">Monumenti</option>
          </select>

          {usingFallbackCoords && (
            <button
              type="button"
              onClick={() => requestUserLocation()}
              className="rounded-full bg-[#221a12] hover:bg-[#382b1e] text-[#f6efe2] px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
            >
              <LocateFixed className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
              <span>Usa la mia posizione</span>
            </button>
          )}
        </div>

        {data?.fallback_used && data.fallback_message && (
          <span role="status" className="text-xs text-[#6c4f22] font-medium">
            {data.fallback_message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 h-[320px] sm:h-[400px] rounded-xl overflow-hidden border border-[#b89352]/45">
          <div ref={mapHostRef} className="w-full h-full" />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0">
          {loading && <p className="text-xs text-[#5c4d3e]">Ricerca beni vicini...</p>}
          {error && <p role="alert" className="text-xs text-red-700">{error}</p>}

          {selectedOpera && (
            <div className="rounded-xl border border-[#b89352]/55 bg-[#fbf7ef] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[#221a12] ${
                    CATEGORY_BADGE_STYLES[selectedOpera.categoria]
                  }`}
                >
                  {CATEGORY_LABELS[selectedOpera.categoria]}
                </span>
                <span className="text-xs font-mono text-[#7a5b28]">
                  {selectedOpera.distance_km} km
                </span>
              </div>
              <h3 className="font-serif-display text-2xl font-semibold text-[#1f1811] leading-tight">
                {selectedOpera.titolo}
              </h3>
              <p className="text-xs text-[#4f4134]">{selectedOpera.ente_nome}</p>
              <p className="text-xs text-[#332a20] leading-relaxed">
                {selectedOpera.breve_sintesi}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onEnterSala4(selectedOpera.id)}
                  className="rounded-full bg-[#221a12] hover:bg-[#382b1e] text-[#f6efe2] text-xs font-semibold px-3.5 py-2 inline-flex items-center gap-1.5"
                >
                  <Box className="w-3.5 h-3.5 text-[#e4cc9a]" aria-hidden="true" />
                  <span>Entra in Sala Opera</span>
                </button>

                {onOpen2DOpera && (
                  <button
                    type="button"
                    onClick={() => onOpen2DOpera(selectedOpera.id)}
                    className="rounded-full border border-[#b89352] text-[#221a12] hover:bg-[#efe5d3] text-xs font-medium px-3.5 py-2"
                  >
                    Scheda 2D
                  </button>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOpera.lat},${selectedOpera.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#b89352]/60 text-[#6c4f22] hover:bg-[#efe5d3] text-xs font-medium px-3 py-2 inline-flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" aria-hidden="true" />
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          )}

          {data && (
            <ul className="space-y-1.5 max-h-[190px] overflow-y-auto custom-scroll pr-1">
              {data.items.map((item) => {
                const active = selectedOpera?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleFocusItem(item)}
                      className={`w-full text-left rounded-lg px-3 py-2 border text-xs flex items-center justify-between gap-2 transition-colors ${
                        active
                          ? "bg-[#e7dac2] border-[#8a672f] text-[#1f1811]"
                          : "bg-[#fbf7ef] border-[#b89352]/30 text-[#332a20] hover:bg-[#efe5d3]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 truncate font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#8a672f] shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.titolo}</span>
                      </span>
                      <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono text-[#6c4f22]">
                        {item.has_archivio && (
                          <Archive className="w-3 h-3 text-[#8a672f]" aria-hidden="true" />
                        )}
                        {item.distance_km} km
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
