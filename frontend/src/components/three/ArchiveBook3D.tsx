import { BookOpen, Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import { fetchOpere } from "../../services/apiClient";
import type { CategoriaOpera, OperaSummaryOut } from "../../types/api";
import { CATEGORIA_LABELS } from "../../utils/format";
import { buildArchiveBookScene, type ArchiveBookHandle } from "./bookGeometry";

const PAGE_SIZE = 14;

const CATEGORIES: Array<{ id: CategoriaOpera | null; label: string }> = [
  { id: null, label: "Tutti" },
  { id: "opera", label: "Opera" },
  { id: "reperto", label: "Reperto" },
  { id: "documento", label: "Documento" },
  { id: "monumento", label: "Monumento" },
];

export function ArchiveBook3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bookHandleRef = useRef<ArchiveBookHandle | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoriaOpera | null>(
    null,
  );
  const debouncedQuery = useDebounce(searchQuery, 260);

  const [results, setResults] = useState<OperaSummaryOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let handle: ArchiveBookHandle | null = null;
    try {
      handle = buildArchiveBookScene(canvas);
      bookHandleRef.current = handle;
    } catch {
      setWebglUnsupported(true);
      return;
    }

    const onResize = () => handle?.resize();
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglUnsupported(true);
    };
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => handle?.resize())
        : null;
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", onResize);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      handle?.dispose();
      bookHandleRef.current = null;
    };
  }, []);

  useEffect(() => {
    bookHandleRef.current?.setOpen(isOpen);
    if (isOpen) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 380);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    loadMoreAbortRef.current?.abort();
    loadMoreAbortRef.current = null;
    setLoadingMore(false);

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchOpere(
      {
        search: debouncedQuery,
        categoria: selectedCategory,
        limit: PAGE_SIZE,
        offset: 0,
      },
      controller.signal,
    )
      .then((res) => {
        if (!controller.signal.aborted) {
          setResults(res.items);
          setTotal(res.total);
        }
      })
      .catch((err) => {
        if (
          controller.signal.aborted ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setResults([]);
        setTotal(0);
        setError("Impossibile caricare gli archivi in questo momento.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
      loadMoreAbortRef.current?.abort();
      loadMoreAbortRef.current = null;
    };
  }, [isOpen, debouncedQuery, selectedCategory]);

  const handleLoadMore = async () => {
    if (loading || loadingMore || results.length >= total) return;

    loadMoreAbortRef.current?.abort();
    const controller = new AbortController();
    loadMoreAbortRef.current = controller;

    setLoadingMore(true);
    setError(null);

    try {
      const res = await fetchOpere(
        {
          search: debouncedQuery,
          categoria: selectedCategory,
          limit: PAGE_SIZE,
          offset: results.length,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;

      setResults((prev) => {
        const seenIds = new Set(prev.map((entry) => entry.id));
        const nextItems = res.items.filter((entry) => !seenIds.has(entry.id));
        return [...prev, ...nextItems];
      });
      setTotal(res.total);
    } catch (err) {
      if (
        controller.signal.aborted ||
        (err instanceof DOMException && err.name === "AbortError")
      ) {
        return;
      }
      setError("Impossibile caricare altri beni culturali in questo momento.");
    } finally {
      if (loadMoreAbortRef.current === controller) {
        setLoadingMore(false);
        loadMoreAbortRef.current = null;
      }
    }
  };

  const handleOpenBook = () => {
    if (!isOpen) setIsOpen(true);
  };

  const handleCloseBook = () => {
    setIsOpen(false);
  };

  return (
    <div className="space-y-10">
      {/* Grand Full-Width 3D Codex Stage */}
      <div className="relative flex flex-col items-center">
        {!webglUnsupported ? (
          <div className="relative w-full max-w-4xl">
            <canvas
              ref={canvasRef}
              onClick={handleOpenBook}
              onMouseEnter={() => bookHandleRef.current?.setHovered(true)}
              onMouseLeave={() => bookHandleRef.current?.setHovered(false)}
              aria-label="Libro 3D Cerca tra gli archivi"
              className={`mx-auto block h-[360px] w-full sm:h-[440px] ${
                !isOpen ? "cursor-pointer" : "cursor-default"
              }`}
            />

            {!isOpen && (
              <div className="mt-3 flex flex-col items-center gap-3 text-center">
                <button
                  type="button"
                  onClick={handleOpenBook}
                  className="btn-museum-primary"
                >
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                  <span>Apri il libro e cerca tra gli archivi</span>
                </button>
                <p className="text-base text-ink-muted">
                  Clicca direttamente sul volume 3D per sfogliare i registri certificati
                </p>
              </div>
            )}
          </div>
        ) : (
          !isOpen && (
            <button
              type="button"
              onClick={handleOpenBook}
              className="btn-museum-primary"
            >
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              <span>Cerca tra gli archivi</span>
            </button>
          )
        )}
      </div>

      {/* Full-Width Interactive Search & 2-Column Editorial Results */}
      {isOpen && (
        <div
          aria-live="polite"
          className="w-full space-y-8 border-t border-gold-light pt-8 transition-all duration-500"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
              Ricerca nei registri certificati
            </h3>
            <button
              type="button"
              onClick={handleCloseBook}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-gold-light px-5 text-base font-medium text-ink-secondary transition hover:border-gold-deep hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span>Chiudi il libro</span>
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div className="relative">
              <label htmlFor="archive-book-search" className="sr-only">
                Cerca per titolo, autore, parola chiave o codice
              </label>
              <Search
                className="pointer-events-none absolute left-1 top-1/2 h-6 w-6 -translate-y-1/2 text-gold-deep"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                id="archive-book-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca per titolo, città, autore o codice (es. Palermo, Caravaggio, COG-008)…"
                className="min-h-[60px] w-full border-b-2 border-gold-deep/50 bg-transparent pl-10 pr-4 text-xl text-ink placeholder:text-ink-muted/65 focus:border-gold-deep focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep focus-visible:rounded-sm sm:text-2xl"
              />
            </div>

            <div
              role="group"
              aria-label="Filtra risultati per categoria"
              className="flex flex-wrap items-center gap-2.5 lg:justify-end"
            >
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex min-h-[48px] items-center rounded-full px-5 text-base font-semibold transition ${
                      active
                        ? "bg-gold-deep text-panna-card"
                        : "border border-gold-light text-ink-secondary hover:border-gold-deep hover:text-ink"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-base font-medium text-ink-muted">
              {loading
                ? "Consultazione dell’archivio in corso…"
                : results.length < total
                  ? `Mostrati ${results.length} di ${total} beni culturali`
                  : `${total} ${total === 1 ? "bene culturale trovato" : "beni culturali trovati"}`}
            </p>

            {error && (
              <p className="text-lg font-medium text-[#8A3727]">{error}</p>
            )}

            {!loading && !error && results.length === 0 && (
              <p className="text-xl text-ink-secondary">
                Nessun risultato corrisponde alla tua ricerca. Prova a cambiare
                parola chiave o rimuovi il filtro per categoria.
              </p>
            )}

            <ul className="grid gap-x-12 gap-y-2 lg:grid-cols-2">
              {results.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col justify-between gap-5 border-t border-gold-light/60 py-7 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-5">
                    <img
                      src={item.immagine_url}
                      alt={item.titolo}
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.src.endsWith("/images/castello-ursino.svg")) {
                          img.src = "/images/castello-ursino.svg";
                        }
                      }}
                      className="h-24 w-24 shrink-0 rounded-xl object-cover"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.15em] text-gold-deep">
                        <span>{CATEGORIA_LABELS[item.categoria]}</span>
                        <span>·</span>
                        <span>{item.qr_code}</span>
                      </div>
                      <h4 className="font-serif text-3xl font-semibold text-ink">
                        {item.titolo}
                      </h4>
                      <p className="text-base font-medium text-ink-secondary">
                        {item.autore} · {item.anno}
                      </p>
                      <p className="text-base text-ink-muted">
                        {item.ente_nome} · {item.citta}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      to={`/opera/${item.id}`}
                      className="btn-museum-secondary whitespace-nowrap"
                    >
                      Apri scheda →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            {!loading && results.length > 0 && results.length < total && (
              <div className="flex flex-col items-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void handleLoadMore()}
                  className="btn-museum-secondary inline-flex min-h-[52px] items-center gap-2.5 px-8 text-base font-semibold disabled:opacity-60"
                >
                  {loadingMore ? (
                    <>
                      <Loader2
                        className="h-5 w-5 animate-spin"
                        aria-hidden="true"
                      />
                      <span>Caricamento…</span>
                    </>
                  ) : (
                    <span>
                      Carica altri{" "}
                      {Math.min(PAGE_SIZE, total - results.length)}
                    </span>
                  )}
                </button>
                <p className="text-sm text-ink-muted">
                  Visualizzati {results.length} su {total} beni culturali
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
