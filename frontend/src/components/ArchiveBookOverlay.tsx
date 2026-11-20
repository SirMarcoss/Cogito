import { useEffect, useState } from "react";
import { Archive, BookOpen, Compass, Search, X } from "lucide-react";
import { getOpere } from "../services/apiClient";
import type { CategoriaOpera, OperaSummaryOut } from "../types/api";
import { CATEGORY_BADGE_STYLES, CATEGORY_LABELS } from "../utils/labels";

export interface ArchiveBookOverlayProps {
  isOpen: boolean;
  selectedOperaId: number | null;
  onSelectOpera: (opera: OperaSummaryOut) => void;
  onEnterSalaOpera?: (opera: OperaSummaryOut) => void;
  onClose: () => void;
}

const CATEGORIES: readonly { value: CategoriaOpera | ""; label: string }[] = [
  { value: "", label: "Tutte" },
  { value: "opera", label: "Opere" },
  { value: "reperto", label: "Reperti" },
  { value: "documento", label: "Documenti" },
  { value: "monumento", label: "Monumenti" },
];

export function ArchiveBookOverlay({
  isOpen,
  selectedOperaId,
  onSelectOpera,
  onEnterSalaOpera,
  onClose,
}: ArchiveBookOverlayProps) {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<CategoriaOpera | "">("");
  const [items, setItems] = useState<OperaSummaryOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      getOpere(
        {
          search: search.trim() || undefined,
          categoria: categoria || undefined,
          limit: 50,
          offset: 0,
        },
        controller.signal,
      )
        .then((res) => {
          setItems(res.items);
          setTotal(res.total);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setError(
            err instanceof Error
              ? err.message
              : "Impossibile consultare il registro d'archivio.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, search, categoria]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-book-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-[#c9a86a]/45 bg-[#12100e] shadow-[0_32px_90px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Intestazione Registro */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#c9a86a]/25 bg-[#181511]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c9a86a]/15 border border-[#c9a86a]/45 flex items-center justify-center text-[#e4cc9a]">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#c9a86a]">
                Sala Archivi • Leggio Centrale
              </p>
              <h2
                id="archive-book-title"
                className="font-serif-display text-xl sm:text-2xl text-white"
              >
                Libro d&apos;Archivio — Registro Storico
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi Libro d'Archivio"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-neutral-200 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Doppia pagina del libro aperto */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#c9a86a]/25">
          {/* Pagina Sinistra: Ricerca e Filtri */}
          <div className="p-5 sm:p-6 flex flex-col gap-5 bg-gradient-to-br from-[#171310] to-[#110f0d] overflow-y-auto custom-scroll">
            <div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#c9a86a]">
                Pagina I • Indice e Ricerca
              </span>
              <h3 className="font-serif-display text-2xl text-white mt-1">
                Cerca nei Fondi di Cogito
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 leading-relaxed">
                Cerca per titolo, autore, ente o codice QR: puoi approfondire le fonti lungo la Sala Archivi oppure entrare direttamente nella Sala Opera.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="archive-book-search"
                className="block text-xs font-medium text-[#e4cc9a]"
              >
                Ricerca testuale
              </label>
              <div className="relative">
                <Search
                  className="w-4 h-4 text-[#c9a86a] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="archive-book-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Es. Castello Ursino, 1669, Bellini..."
                  className="w-full rounded-xl bg-black/45 border border-[#c9a86a]/30 focus:border-[#e4cc9a] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#e4cc9a]">
                Filtra per categoria
              </span>
              <div
                role="group"
                aria-label="Filtra catalogo per categoria"
                className="flex flex-wrap gap-2"
              >
                {CATEGORIES.map((cat) => {
                  const active = categoria === cat.value;
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategoria(cat.value)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors border ${
                        active
                          ? "bg-[#c9a86a] text-[#0b0b0c] border-[#e4cc9a]"
                          : "bg-white/[0.04] text-neutral-200 border-white/15 hover:border-[#c9a86a]/55"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto rounded-xl border border-[#c9a86a]/20 bg-[#c9a86a]/[0.05] p-3.5 text-xs text-neutral-300 leading-relaxed">
              <span className="text-[#e4cc9a] font-medium block mb-0.5">
                Doppio percorso
              </span>
              Scegli &ldquo;Esplora negli Archivi&rdquo; per aggiornare le stele e il Grafo Relazionale, oppure &ldquo;Entra in Sala Opera&rdquo; per accedere subito all&apos;opera scelta.
            </div>
          </div>

          {/* Pagina Destra: Risultati */}
          <div className="p-5 sm:p-6 flex flex-col min-h-0 bg-gradient-to-bl from-[#181410] to-[#110f0d]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#c9a86a]">
                Pagina II • Beni Rilevati
              </span>
              <span className="text-xs text-neutral-300">
                {loading ? "Ricerca..." : `${total} risultati`}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll pr-1 space-y-2.5">
              {error && (
                <p
                  role="alert"
                  className="text-xs text-red-300 bg-red-950/50 border border-red-400/30 rounded-xl p-3"
                >
                  {error}
                </p>
              )}

              {!loading && !error && items.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-neutral-300">
                  Nessun bene corrisponde ai criteri di ricerca selezionati.
                </div>
              )}

              {items.map((item) => {
                const isSelected = selectedOperaId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl p-3.5 border transition-all space-y-3 ${
                      isSelected
                        ? "bg-[#c9a86a]/15 border-[#e4cc9a]"
                        : "bg-white/[0.03] border-white/10 hover:border-[#c9a86a]/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.immagine_url}
                        alt={item.titolo}
                        className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0 bg-neutral-900"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              CATEGORY_BADGE_STYLES[item.categoria]
                            }`}
                          >
                            {CATEGORY_LABELS[item.categoria]}
                          </span>
                          {item.has_archivio && (
                            <span
                              title="Fonte d'archivio collegata"
                              className="inline-flex items-center gap-1 text-[10px] text-[#e4cc9a] bg-[#c9a86a]/15 border border-[#c9a86a]/40 px-2 py-0.5 rounded-full"
                            >
                              <Archive className="w-3 h-3" aria-hidden="true" />
                              Archivio
                            </span>
                          )}
                        </div>
                        <p className="font-serif-display text-lg text-white leading-tight truncate">
                          {item.titolo}
                        </p>
                        <p className="text-xs text-neutral-300 truncate mt-0.5">
                          {item.autore} • {item.anno}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {item.ente_nome}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectOpera(item);
                          onClose();
                        }}
                        className="rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-medium px-3.5 py-1.5 transition-colors"
                      >
                        Esplora negli Archivi
                      </button>

                      {onEnterSalaOpera && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEnterSalaOpera(item);
                          }}
                          className="rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] text-[11px] font-semibold px-3.5 py-1.5 inline-flex items-center gap-1 transition-colors"
                        >
                          <Compass className="w-3 h-3" aria-hidden="true" />
                          <span>Entra in Sala Opera</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
