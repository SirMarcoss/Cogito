import L from "leaflet";
import { useEffect, useRef } from "react";
import type { OperaNearbyOut } from "../../types/api";
import {
  buildGoogleMapsDirectionsUrl,
  CATEGORIA_LABELS,
  formatDistanceKm,
} from "../../utils/format";

interface HeritageMapProps {
  centerLat: number;
  centerLng: number;
  items: OperaNearbyOut[];
  zoomRadiusKm?: number | null;
  showOriginMarker?: boolean;
  onSelectOpera: (operaId: number) => void;
}

const OSM_PRIMARY_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_FALLBACK_TILES =
  "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";

function createHeritagePinIcon(): L.DivIcon {
  return L.divIcon({
    className: "cogito-heritage-pin",
    iconSize: [38, 46],
    iconAnchor: [19, 44],
    popupAnchor: [0, -40],
    html: `<svg width="38" height="46" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M18 1.5C9.44 1.5 2.5 8.44 2.5 17C2.5 28.2 18 42 18 42C18 42 33.5 28.2 33.5 17C33.5 8.44 26.56 1.5 18 1.5Z" fill="#856527" stroke="#FAF6EE" stroke-width="2.5"/>
      <circle cx="18" cy="17" r="6.2" fill="#FAF6EE" stroke="#E0CFA8" stroke-width="1.5"/>
    </svg>`,
  });
}

function createUserOriginIcon(): L.DivIcon {
  return L.divIcon({
    className: "cogito-origin-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:rgba(168,132,62,0.26);display:flex;align-items:center;justify-content:center;">
      <div style="width:14px;height:14px;border-radius:9999px;background:#1E1812;border:2.5px solid #FAF6EE;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
    </div>`,
  });
}

function buildPopupElement(
  item: OperaNearbyOut,
  onSelectOpera: (operaId: number) => void,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.width = "255px";
  wrapper.style.fontFamily = "Inter, sans-serif";
  wrapper.style.padding = "2px";

  const meta = document.createElement("div");
  meta.textContent = `${CATEGORIA_LABELS[item.categoria]} · ${formatDistanceKm(item.distance_km)}`;
  meta.style.fontSize = "12px";
  meta.style.fontWeight = "600";
  meta.style.color = "#856527";
  meta.style.textTransform = "uppercase";
  meta.style.letterSpacing = "0.08em";

  const title = document.createElement("h4");
  title.textContent = item.titolo;
  title.style.fontFamily = '"Cormorant Garamond", Georgia, serif';
  title.style.fontSize = "22px";
  title.style.fontWeight = "700";
  title.style.lineHeight = "1.2";
  title.style.color = "#1E1812";
  title.style.margin = "6px 0 4px 0";

  const ente = document.createElement("p");
  ente.textContent = `${item.ente_nome} · ${item.citta}`;
  ente.style.fontSize = "14px";
  ente.style.color = "#4A4035";
  ente.style.margin = "0 0 14px 0";

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.flexDirection = "column";
  actions.style.gap = "8px";

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.textContent = "Apri scheda";
  openBtn.style.minHeight = "46px";
  openBtn.style.width = "100%";
  openBtn.style.borderRadius = "9999px";
  openBtn.style.background = "#856527";
  openBtn.style.color = "#FFFDF8";
  openBtn.style.fontSize = "15px";
  openBtn.style.fontWeight = "600";
  openBtn.style.border = "none";
  openBtn.style.cursor = "pointer";
  openBtn.addEventListener("click", () => {
    onSelectOpera(item.id);
  });

  const mapsLink = document.createElement("a");
  mapsLink.href = buildGoogleMapsDirectionsUrl(item.lat, item.lng);
  mapsLink.target = "_blank";
  mapsLink.rel = "noopener noreferrer";
  mapsLink.textContent = "Calcola percorso →";
  mapsLink.style.display = "inline-flex";
  mapsLink.style.alignItems = "center";
  mapsLink.style.justifyContent = "center";
  mapsLink.style.minHeight = "44px";
  mapsLink.style.width = "100%";
  mapsLink.style.borderRadius = "9999px";
  mapsLink.style.border = "1.5px solid rgba(133, 101, 39, 0.5)";
  mapsLink.style.background = "#FAF6EE";
  mapsLink.style.color = "#1E1812";
  mapsLink.style.fontSize = "14px";
  mapsLink.style.fontWeight = "600";
  mapsLink.style.textDecoration = "none";

  actions.append(openBtn, mapsLink);
  wrapper.append(meta, title, ente, actions);
  return wrapper;
}

export function HeritageMap({
  centerLat,
  centerLng,
  items,
  zoomRadiusKm = null,
  showOriginMarker = true,
  onSelectOpera,
}: HeritageMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelectOpera);
  onSelectRef.current = onSelectOpera;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      center: [centerLat, centerLng],
      zoom: 15,
      scrollWheelZoom: false,
    });

    // Standard OpenStreetMap tiles: 100% free, zero API key required
    let switchedToFallback = false;
    const primaryLayer = L.tileLayer(OSM_PRIMARY_TILES, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    primaryLayer.on("tileerror", () => {
      if (switchedToFallback) return;
      switchedToFallback = true;
      map.removeLayer(primaryLayer);
      L.tileLayer(OSM_FALLBACK_TILES, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
    });

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    // Ensure proper map sizing across full-width containers and animations
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            map.invalidateSize();
          })
        : null;
    resizeObserver?.observe(el);

    return () => {
      window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const bounds = L.latLngBounds([]);

    if (showOriginMarker) {
      const originMarker = L.marker([centerLat, centerLng], {
        icon: createUserOriginIcon(),
      }).bindTooltip("La tua posizione attuale", { direction: "top" });
      group.addLayer(originMarker);
      bounds.extend([centerLat, centerLng]);
    }

    if (zoomRadiusKm != null && zoomRadiusKm > 0) {
      const radiusCircle = L.circle([centerLat, centerLng], {
        radius: zoomRadiusKm * 1000,
        color: "#A8843E",
        weight: 1.5,
        dashArray: "6 6",
        fillColor: "#A8843E",
        fillOpacity: 0.05,
      });
      group.addLayer(radiusCircle);
    }

    const pinIcon = createHeritagePinIcon();
    items.forEach((item) => {
      const marker = L.marker([item.lat, item.lng], {
        icon: pinIcon,
        title: item.titolo,
        alt: item.titolo,
      });
      marker.bindPopup(() =>
        buildPopupElement(item, (id) => onSelectRef.current(id)),
      );
      group.addLayer(marker);
      bounds.extend([item.lat, item.lng]);
    });

    if (zoomRadiusKm != null && zoomRadiusKm > 0) {
      const radiusBounds = L.latLng(centerLat, centerLng).toBounds(
        zoomRadiusKm * 2000,
      );
      map.fitBounds(radiusBounds, { padding: [24, 24], maxZoom: 13 });
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [44, 44], maxZoom: 15 });
    } else {
      map.setView([centerLat, centerLng], 8);
    }
  }, [centerLat, centerLng, items, showOriginMarker, zoomRadiusKm]);

  return (
    <div className="cogito-map-wrapper overflow-hidden rounded-2xl border border-gold-light">
      <div
        ref={containerRef}
        role="region"
        aria-label="Mappa interattiva dei beni culturali"
        className="h-[440px] w-full lg:h-[520px]"
      />
    </div>
  );
}
