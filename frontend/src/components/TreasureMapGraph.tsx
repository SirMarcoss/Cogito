import { useEffect, useState } from "react";
import { Compass, Network, X } from "lucide-react";
import type { CorrelazioneItemOut, OperaDetailOut } from "../types/api";
import { formatRelationType } from "../utils/labels";

export interface TreasureMapGraphProps {
  sourceOpera: OperaDetailOut | null;
  correlazioni: CorrelazioneItemOut[];
  loading: boolean;
  onSelectNode: (operaId: number) => void;
  onOpenBook?: () => void;
  onClose?: () => void;
}

const NODE_POSITIONS: readonly { x: number; y: number; curveCtrlX: number; curveCtrlY: number }[] = [
  { x: 18, y: 26, curveCtrlX: 30, curveCtrlY: 22 },
  { x: 82, y: 27, curveCtrlX: 70, curveCtrlY: 22 },
  { x: 50, y: 82, curveCtrlX: 60, curveCtrlY: 66 },
];

/**
 * Grafo Relazionale interattivo (Sala III — Tappa 3).
 * Visualizza l'opera sorgente al centro e fino a 3 connessioni storico-territoriali cliccabili.
 */
export function TreasureMapGraph({
  sourceOpera,
  correlazioni,
  loading,
  onSelectNode,
  onOpenBook,
  onClose,
}: TreasureMapGraphProps) {
  const [hoveredItem, setHoveredItem] = useState<CorrelazioneItemOut | null>(null);

  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const visibleCorrelations = correlazioni.slice(0, 3);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="relational-graph-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] rounded-2xl border border-[#c9a86a]/60 bg-[#f6efe2] text-[#221a12] shadow-[0_32px_90px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#c9a86a]/35 bg-[#ede3d0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c9a86a]/25 border border-[#b08a49] flex items-center justify-center text-[#6b4f21]">
              <Network className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#7a5b28] font-semibold">
                Sala Archivi • Rete delle Relazioni Culturali
              </p>
              <h2
                id="relational-graph-title"
                className="font-serif-display text-xl sm:text-2xl font-semibold text-[#1f1811]"
              >
                Grafo Relazionale — Connessioni Storiche
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi Grafo Relazionale"
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/15 border border-[#b08a49]/40 flex items-center justify-center text-[#2b2117] transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Corpo Grafo Relazionale */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scroll flex-1 space-y-4">
          {!sourceOpera ? (
            <div className="rounded-2xl border border-[#c9a86a]/45 bg-[#fbf7ef] p-8 text-center space-y-4">
              <p className="font-serif-display text-2xl font-semibold text-[#221a12]">
                Nessuna rete relazionale ancora selezionata
              </p>
              <p className="text-sm text-[#4f4134] max-w-xl mx-auto leading-relaxed">
                Consulta il Libro d&apos;Archivio per selezionare un&apos;opera di partenza e ricostruire i legami storici, archivistici e territoriali con gli altri poli di Cogito.
              </p>
              {onOpenBook && (
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    onOpenBook();
                  }}
                  className="rounded-full bg-[#221a12] hover:bg-[#382b1e] text-[#f6efe2] text-xs font-semibold px-5 py-2.5 transition-colors"
                >
                  Apri Libro d&apos;Archivio
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className="relative w-full h-[380px] sm:h-[440px] rounded-2xl border border-[#b89352]/55 overflow-hidden"
                style={{
                  background:
                    "radial-gradient(circle at 50% 48%, #fbf6ec 0%, #efe5d3 68%, #e4d5bc 100%)",
                }}
              >
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  {[20, 40, 60, 80].map((pos) => (
                    <g key={pos} stroke="rgba(150,118,64,0.18)" strokeWidth="0.22">
                      <line x1={pos} y1="0" x2={pos} y2="100" />
                      <line x1="0" y1={pos} x2="100" y2={pos} />
                    </g>
                  ))}

                  <rect
                    x="1.5"
                    y="2"
                    width="97"
                    height="96"
                    fill="none"
                    stroke="rgba(150,118,64,0.45)"
                    strokeWidth="0.35"
                  />

                  {!loading &&
                    visibleCorrelations.map((item, idx) => {
                      const pos = NODE_POSITIONS[idx];
                      if (!pos) return null;
                      return (
                        <path
                          key={item.opera.id}
                          d={`M 50 48 Q ${pos.curveCtrlX} ${pos.curveCtrlY} ${pos.x} ${pos.y}`}
                          fill="none"
                          stroke="#8a672f"
                          strokeOpacity="0.72"
                          strokeWidth="0.55"
                          strokeDasharray="1.8 1.4"
                        />
                      );
                    })}
                </svg>

                {/* Simbolo orientamento */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-3 left-3 w-12 h-12 rounded-full border border-[#b08a49]/45 bg-[#f7f1e5]/85 flex items-center justify-center text-[#7a5b28]"
                >
                  <Compass className="w-5 h-5" />
                </div>

                {/* Nodo Centrale */}
                <div
                  style={{ left: "50%", top: "48%" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 w-48 sm:w-60"
                >
                  <button
                    type="button"
                    onClick={() => onSelectNode(sourceOpera.id)}
                    className="w-full text-center rounded-2xl bg-[#221a12] hover:bg-[#33271b] border-2 border-[#c9a86a] px-3.5 py-3 shadow-xl transition-transform hover:scale-[1.03]"
                  >
                    <span className="block text-[9px] uppercase tracking-[0.22em] text-[#e4cc9a]">
                      Nodo Centrale • Entra in Sala Opera
                    </span>
                    <span className="block font-serif-display text-base sm:text-lg font-semibold text-white leading-tight mt-0.5 line-clamp-2">
                      {sourceOpera.titolo}
                    </span>
                    <span className="block text-[11px] text-neutral-300 truncate mt-0.5">
                      {sourceOpera.ente_nome}
                    </span>
                  </button>
                </div>

                {/* Nodi Correlati */}
                {loading ? (
                  <div className="absolute inset-0 flex items-end justify-center pb-6">
                    <span className="rounded-full bg-[#221a12] text-[#e4cc9a] px-4 py-1.5 text-xs">
                      Elaborazione connessioni archivistiche...
                    </span>
                  </div>
                ) : (
                  visibleCorrelations.map((item, idx) => {
                    const pos = NODE_POSITIONS[idx];
                    if (!pos) return null;
                    return (
                      <div
                        key={item.opera.id}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-10 w-44 sm:w-56"
                      >
                        <button
                          type="button"
                          onMouseEnter={() => setHoveredItem(item)}
                          onFocus={() => setHoveredItem(item)}
                          onClick={() => onSelectNode(item.opera.id)}
                          className="w-full text-left rounded-xl bg-[#fbf7ef] hover:bg-white border-2 border-[#b89352]/75 hover:border-[#7a5b28] px-3 py-2.5 shadow-lg transition-transform hover:scale-[1.03]"
                        >
                          <span className="inline-block text-[9px] uppercase tracking-[0.16em] text-[#7a5b28] bg-[#c9a86a]/20 border border-[#b89352]/40 rounded-full px-2 py-0.5 mb-1 font-semibold">
                            {formatRelationType(item.tipo_relazione)}
                          </span>
                          <span className="block font-serif-display text-sm sm:text-base font-semibold text-[#1f1811] leading-snug line-clamp-2">
                            {item.opera.titolo}
                          </span>
                          <span className="block text-[10px] text-[#5c4d3e] truncate mt-0.5">
                            {item.opera.ente_nome}
                          </span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="rounded-xl border border-[#b89352]/40 bg-[#fbf7ef] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#7a5b28] font-semibold">
                    {hoveredItem
                      ? `Relazione: ${formatRelationType(hoveredItem.tipo_relazione)}`
                      : "Esplorazione grafo"}
                  </p>
                  <p className="text-xs sm:text-sm text-[#2d241b] leading-relaxed">
                    {hoveredItem
                      ? `${hoveredItem.opera.titolo} — ${hoveredItem.motivazione}`
                      : "Passa il cursore o clicca su qualsiasi nodo del grafo relazionale per leggere la motivazione storica ed entrare direttamente nella Sala Opera."}
                  </p>
                </div>
                {hoveredItem && (
                  <button
                    type="button"
                    onClick={() => onSelectNode(hoveredItem.opera.id)}
                    className="shrink-0 rounded-full bg-[#221a12] hover:bg-[#382b1e] text-[#f6efe2] text-xs font-semibold px-4 py-2 transition-colors"
                  >
                    Entra in Sala Opera
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const RelationalGraphModal = TreasureMapGraph;
