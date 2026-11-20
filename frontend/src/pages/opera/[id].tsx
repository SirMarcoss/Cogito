import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Box, MapPin, QrCode } from "lucide-react";
import { OperaAnalysisContent } from "../../components/OperaAnalysisContent";
import { OperaDetailSkeleton } from "../../components/OperaSkeleton";
import { ApiError, getOperaById } from "../../services/apiClient";
import type { OperaDetailOut, OperaSummaryOut } from "../../types/api";
import { CATEGORY_BADGE_STYLES, CATEGORY_LABELS } from "../../utils/labels";

export interface OperaPageProps {
  operaId: number;
  initialOpera?: OperaDetailOut | null;
  onBackToMap?: () => void;
}

/**
 * Scheda opera 2D veloce e accessibile (`/opera/[id]`).
 * Zero dipendenze WebGL/Three.js per caricamento immediato su mobile da QR code.
 */
export function OperaDetailPage({
  operaId,
  initialOpera = null,
  onBackToMap,
}: OperaPageProps) {
  const navigate = useNavigate();

  const [opera, setOpera] = useState<OperaDetailOut | null>(initialOpera);
  const [operaError, setOperaError] = useState<string | null>(null);
  const [loadingOpera, setLoadingOpera] = useState(!initialOpera);

  useEffect(() => {
    if (initialOpera && initialOpera.id === operaId) {
      setOpera(initialOpera);
      setOperaError(null);
      setLoadingOpera(false);
      return;
    }

    const controller = new AbortController();
    setLoadingOpera(true);
    setOperaError(null);

    getOperaById(operaId, controller.signal)
      .then(setOpera)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) {
          setOperaError("Opera o codice QR non trovato");
          return;
        }
        setOperaError(
          err instanceof Error ? err.message : "Errore di caricamento opera.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOpera(false);
      });

    return () => controller.abort();
  }, [operaId, initialOpera]);

  const handleSelectRelated = (related: OperaSummaryOut) => {
    navigate(`/opera/${related.id}`);
  };

  if (loadingOpera) {
    return <OperaDetailSkeleton />;
  }

  if (operaError || !opera) {
    return (
      <main
        role="alert"
        className="min-h-screen bg-museum-bg text-museum-ink flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="museum-glass max-w-md w-full rounded-2xl border border-[#c9a86a]/40 p-6 space-y-4">
          <h1 className="font-serif-display text-3xl text-white">
            Opera o codice QR non trovato
          </h1>
          <p className="text-sm text-neutral-300">
            {operaError ?? "Il bene culturale richiesto non è presente nel catalogo."}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {onBackToMap ? (
              <button
                type="button"
                onClick={onBackToMap}
                className="rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] font-semibold text-xs px-5 py-2.5 transition-colors"
              >
                Torna alla mappa
              </button>
            ) : (
              <Link
                to="/map"
                className="rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] font-semibold text-xs px-5 py-2.5 transition-colors"
              >
                Torna alla mappa
              </Link>
            )}
            <Link
              to="/"
              className="rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium px-5 py-2.5 transition-colors"
            >
              Apri Hub 3D
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-museum-bg text-museum-ink pb-14">
      {/* Top bar di navigazione rapida */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0b0c]/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {onBackToMap ? (
              <button
                type="button"
                onClick={onBackToMap}
                className="museum-glass hover:border-[#c9a86a]/65 rounded-full px-3.5 py-2 text-xs text-white inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
                <span>Torna alla mappa</span>
              </button>
            ) : (
              <Link
                to="/map"
                className="museum-glass hover:border-[#c9a86a]/65 rounded-full px-3.5 py-2 text-xs text-white inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
                <span>Torna alla mappa</span>
              </Link>
            )}

            <Link
              to="/"
              className="museum-glass hover:border-[#c9a86a]/65 rounded-full px-3.5 py-2 text-xs text-neutral-200 transition-colors"
            >
              Hub 3D
            </Link>
          </div>

          <Link
            to={`/?room=4&operaId=${opera.id}`}
            className="rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] font-semibold text-xs px-4 py-2 inline-flex items-center gap-1.5 shadow-lg transition-colors"
          >
            <Box className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Entra nella Sala 3D</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 sm:px-6 space-y-6">
        {/* Hero Opera */}
        <article className="museum-glass rounded-2xl border border-[#c9a86a]/30 overflow-hidden shadow-2xl">
          <div className="relative h-56 sm:h-80 w-full bg-neutral-950 overflow-hidden">
            <img
              src={opera.immagine_url}
              alt={opera.titolo}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-transparent to-black/30" />
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full border backdrop-blur-md ${
                  CATEGORY_BADGE_STYLES[opera.categoria]
                }`}
              >
                {CATEGORY_LABELS[opera.categoria]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 border border-white/15 px-2.5 py-1 text-[11px] font-mono text-[#e4cc9a]">
                <QrCode className="w-3 h-3" aria-hidden="true" />
                {opera.qr_code}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#e4cc9a]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {opera.ente.nome} ({opera.ente.citta})
              </span>
              <Link
                to={`/map?highlight=${opera.id}`}
                className="underline hover:text-white transition-colors"
              >
                Vedi sulla mappa
              </Link>
            </div>

            <h1 className="font-serif-display text-3xl sm:text-5xl font-medium text-white leading-tight">
              {opera.titolo}
            </h1>

            <p className="text-sm sm:text-base text-neutral-300">
              {opera.autore} • {opera.anno}
              {opera.sala ? ` • ${opera.sala}` : ""}
            </p>
          </div>
        </article>

        {/* Contenuto condiviso: Livelli, Voce Web Speech, Archivio, Correlazioni, Q&A */}
        <OperaAnalysisContent
          opera={opera}
          onSelectRelated={handleSelectRelated}
        />
      </main>
    </div>
  );
}

export default OperaDetailPage;
