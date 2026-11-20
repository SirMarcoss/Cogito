import { useEffect, useState } from "react";
import { Compass, Map, MapPin, X } from "lucide-react";
import type { HubZoneId } from "./hub3d/MuseumSceneController";
import { TerritoryMapPanel } from "./TerritoryMapModal";

export interface MuseumFloorplanModalProps {
  isOpen: boolean;
  initialTab?: "floorplan" | "territory";
  activeZone: HubZoneId;
  visitorPos: { x: number; z: number };
  highlightOperaId?: number | null;
  hasActiveRoom4Opera: boolean;
  onSelectZone: (zone: HubZoneId) => void;
  onEnterSala4Opera: (operaId: number) => void;
  onOpen2DOpera?: (operaId: number) => void;
  onClose: () => void;
}

/**
 * Converte le coordinate reali 3D della pianta cruciforme
 * (x ∈ [-62, +62], z ∈ [-62, +38]) nell'area SVG (viewBox 560x440).
 */
function toSvgPoint(x: number, z: number): { cx: number; cy: number } {
  const cx = 280 + x * 4.0;
  const cy = 284 + z * 4.0;
  return {
    cx: Math.max(18, Math.min(542, cx)),
    cy: Math.max(18, Math.min(422, cy)),
  };
}

export function MuseumFloorplanModal({
  isOpen,
  initialTab = "floorplan",
  activeZone,
  visitorPos,
  highlightOperaId = null,
  hasActiveRoom4Opera,
  onSelectZone,
  onEnterSala4Opera,
  onOpen2DOpera,
  onClose,
}: MuseumFloorplanModalProps) {
  const [tab, setTab] = useState<"floorplan" | "territory">(initialTab);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const visitorSvg = toSvgPoint(visitorPos.x, visitorPos.z);

  const handleRoomClick = (zone: HubZoneId) => {
    onClose();
    onSelectZone(zone);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="floorplan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] rounded-2xl border border-[#d4af37]/55 bg-[#17120c] text-[#f1e6c8] shadow-[0_32px_90px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#d4af37]/30 bg-[#211a11]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/60 flex items-center justify-center text-[#f3dfa2]">
              <Map className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#c9a86a] font-semibold">
                Orientamento &amp; Territorio
              </p>
              <h2
                id="floorplan-modal-title"
                className="font-serif-display text-xl sm:text-2xl font-semibold text-[#fff7e0]"
              >
                Mappa del Museo Cogito
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Modalità mappa"
              className="inline-flex rounded-full bg-[#100c08] p-1 border border-[#d4af37]/35"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "floorplan"}
                onClick={() => setTab("floorplan")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                  tab === "floorplan"
                    ? "bg-[#d4af37] text-[#14110c]"
                    : "text-[#c9b995] hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Planimetria Sale</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "territory"}
                onClick={() => setTab("territory")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                  tab === "territory"
                    ? "bg-[#d4af37] text-[#14110c]"
                    : "text-[#c9b995] hover:text-white"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Territorio (Catania)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi mappa"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-[#d4af37]/40 flex items-center justify-center text-[#f1e6c8] transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scroll flex-1">
          {tab === "floorplan" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Planimetria Architettonica Cruciforme SVG */}
              <div className="lg:col-span-7 rounded-2xl border border-[#d4af37]/40 bg-[#0d1018] p-3 sm:p-4">
                <svg
                  viewBox="0 0 560 440"
                  className="w-full max-h-[440px] mx-auto"
                  aria-label="Planimetria architettonica cruciforme delle sale del Museo Cogito"
                >
                  <defs>
                    <pattern id="archGridNight" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="rgba(212,175,55,0.08)"
                        strokeWidth="0.7"
                      />
                    </pattern>
                  </defs>
                  <rect width="560" height="440" fill="#0d111a" rx="12" />
                  <rect width="560" height="440" fill="url(#archGridNight)" rx="12" />

                  {/* Luna decorativa nell'angolo */}
                  <circle cx="88" cy="64" r="16" fill="#d8e4ff" opacity="0.22" />
                  <circle cx="94" cy="61" r="14" fill="#0d111a" />

                  {/* SALA OPERA — ALA NORD (x ∈ [-14, 14], z ∈ [-58, -26]) -> x 224..336, y 52..180 */}
                  <g
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRoomClick("room4")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleRoomClick("room4");
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x="224"
                      y="52"
                      width="112"
                      height="128"
                      rx="4"
                      fill={activeZone === "room4" ? "#6b5526" : "#2d2418"}
                      stroke="#d4af37"
                      strokeWidth={activeZone === "room4" ? "3" : "1.8"}
                    />
                    <text x="280" y="108" textAnchor="middle" fill="#fff7e0" fontSize="11.5" fontWeight="700">
                      SALA OPERA
                    </text>
                    <text x="280" y="124" textAnchor="middle" fill="#d9c79a" fontSize="7.5">
                      Teca • Guida • Poltrona
                    </text>
                    <line x1="264" y1="180" x2="296" y2="180" stroke="#f3dfa2" strokeWidth="4" />
                  </g>

                  {/* SALA TERRITORIO — ALA OVEST (x ∈ [-58, -14], z ∈ [-19, -7]) -> x 48..224, y 208..256 */}
                  <g
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRoomClick("room2")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleRoomClick("room2");
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x="48"
                      y="208"
                      width="176"
                      height="48"
                      rx="4"
                      fill={activeZone === "room2" ? "#6b5526" : "#2d2418"}
                      stroke="#d4af37"
                      strokeWidth={activeZone === "room2" ? "3" : "1.8"}
                    />
                    <text x="136" y="229" textAnchor="middle" fill="#fff7e0" fontSize="10.5" fontWeight="700">
                      SALA TERRITORIO
                    </text>
                    <text x="136" y="243" textAnchor="middle" fill="#d9c79a" fontSize="8">
                      7 Opere + Mappa Reale OSM
                    </text>
                    <line x1="54" y1="214" x2="54" y2="250" stroke="#c96b4b" strokeWidth="3" />
                  </g>

                  {/* HALL PRINCIPALE — CENTRO (x ∈ [-14, 14], z ∈ [-26, 0]) -> x 224..336, y 180..284 */}
                  <g
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRoomClick("room1")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleRoomClick("room1");
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x="224"
                      y="180"
                      width="112"
                      height="104"
                      rx="4"
                      fill={activeZone === "room1" ? "#6b5526" : "#3a2e1e"}
                      stroke="#d4af37"
                      strokeWidth={activeZone === "room1" ? "3" : "1.8"}
                    />
                    <rect x="298" y="206" width="12" height="10" fill="#d4af37" rx="1.5" />
                    <text x="280" y="232" textAnchor="middle" fill="#fff7e0" fontSize="11" fontWeight="700">
                      HALL PRINCIPALE
                    </text>
                    <text x="280" y="246" textAnchor="middle" fill="#d9c79a" fontSize="8">
                      Totem QR &amp; Portali
                    </text>
                  </g>

                  {/* SALA ARCHIVI — ALA EST (x ∈ [14, 58], z ∈ [-19, -7]) -> x 336..512, y 208..256 */}
                  <g
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRoomClick("room3")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleRoomClick("room3");
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x="336"
                      y="208"
                      width="176"
                      height="48"
                      rx="4"
                      fill={activeZone === "room3" ? "#6b5526" : "#2d2418"}
                      stroke="#d4af37"
                      strokeWidth={activeZone === "room3" ? "3" : "1.8"}
                    />
                    <rect x="358" y="226" width="10" height="10" fill="#c96b4b" rx="2" />
                    <text x="428" y="229" textAnchor="middle" fill="#fff7e0" fontSize="10.5" fontWeight="700">
                      SALA ARCHIVI
                    </text>
                    <text x="428" y="243" textAnchor="middle" fill="#d9c79a" fontSize="8">
                      Leggio • Stele • Grafo
                    </text>
                    <line x1="506" y1="214" x2="506" y2="250" stroke="#c96b4b" strokeWidth="3" />
                  </g>

                  {/* ESTERNO SOSPESO — FONTANA LUNARE & FACCIATA (z ∈ [0, 32]) */}
                  <g
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRoomClick("exterior")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleRoomClick("exterior");
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x="224"
                      y="286"
                      width="112"
                      height="30"
                      rx="3"
                      fill={activeZone === "exterior" ? "#3b5070" : "#1f2738"}
                      stroke="#89a8db"
                      strokeWidth={activeZone === "exterior" ? "2.6" : "1.4"}
                    />
                    <rect x="262" y="316" width="36" height="44" fill="#232c3f" stroke="#89a8db" strokeWidth="1.2" />
                    <circle
                      cx="280"
                      cy="380"
                      r="26"
                      fill={activeZone === "exterior" ? "#2e4b73" : "#1b2840"}
                      stroke="#89a8db"
                      strokeWidth={activeZone === "exterior" ? "2.8" : "1.6"}
                    />
                    <circle cx="280" cy="380" r="13" fill="#4f83b8" opacity="0.7" />
                    <text x="280" y="422" textAnchor="middle" fill="#cfe0ff" fontSize="10" fontWeight="700">
                      ESTERNO NOTTURNO · FONTANA NEL VUOTO
                    </text>
                  </g>

                  {/* Segnalatore posizione visitatore in tempo reale */}
                  <g>
                    <circle cx={visitorSvg.cx} cy={visitorSvg.cy} r="10" fill="rgba(212, 175, 55, 0.28)" />
                    <circle
                      cx={visitorSvg.cx}
                      cy={visitorSvg.cy}
                      r="5"
                      fill="#f3dfa2"
                      stroke="#14110c"
                      strokeWidth="2"
                    />
                  </g>
                </svg>
              </div>

              {/* Pulsanti rapidi */}
              <div className="lg:col-span-5 space-y-3">
                <p className="text-xs sm:text-sm text-[#dfd2b4] leading-relaxed">
                  Tocca qualsiasi ambiente della planimetria cruciforme o i pulsanti qui sotto per spostare la telecamera in tempo reale senza cambiare pagina.
                </p>

                <div className="space-y-2">
                  {(
                    [
                      {
                        id: "exterior" as const,
                        title: "Esterno — Notte Lunare & Fontana",
                        desc: "Vista aerea sul museo e fontana sospesi tra le nuvole nel fascio lunare.",
                      },
                      {
                        id: "room1" as const,
                        title: "Hall Principale",
                        desc: "Grande atrio con Totem QR, portale legno e accessi alle ali.",
                      },
                      {
                        id: "room2" as const,
                        title: "Sala Territorio",
                        desc: "Ala occidentale con 7 opere vicine e mappa reale OSM di Catania.",
                      },
                      {
                        id: "room3" as const,
                        title: "Sala Archivi",
                        desc: "Ala orientale con leggio animato, stele illuminate e Grafo Relazionale.",
                      },
                      {
                        id: "room4" as const,
                        title: "Sala Opera",
                        desc: hasActiveRoom4Opera
                          ? "Santuario settentrionale: teca, connessioni, info autore e poltrona."
                          : "Apri un'opera via QR (o avvia l'esposizione dimostrativa).",
                      },
                    ] as const
                  ).map((item) => {
                    const isCurrent = activeZone === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleRoomClick(item.id)}
                        className={`w-full text-left rounded-xl p-3 border transition-colors ${
                          isCurrent
                            ? "bg-[#d4af37]/20 border-[#d4af37]"
                            : "bg-[#120e09] border-[#d4af37]/25 hover:bg-[#231c13]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif-display text-lg font-semibold text-[#fff7e0]">
                            {item.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#d4af37]">
                              Sei qui
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#c7b794] mt-0.5">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <TerritoryMapPanel
              highlightOperaId={highlightOperaId}
              onEnterSala4={(operaId) => {
                onClose();
                onEnterSala4Opera(operaId);
              }}
              onOpen2DOpera={onOpen2DOpera}
            />
          )}
        </div>
      </div>
    </div>
  );
}
