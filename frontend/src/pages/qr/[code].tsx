import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode } from "lucide-react";
import { ApiError, resolveQrCode } from "../../services/apiClient";
import type { OperaDetailOut } from "../../types/api";

export interface QrPageProps {
  /** Codice QR estratto dal route param `/qr/:code` (es. "COG-001"). */
  code: string;
  onResolved?: (opera: OperaDetailOut) => void;
  onBackToMap?: () => void;
}

/**
 * Pagina deep-link QR 2D veloce (`/qr/[code]`).
 * Nessun caricamento WebGL per garantire apertura immediata su smartphone.
 */
export function QrResolverPage({ code, onResolved, onBackToMap }: QrPageProps) {
  const [opera, setOpera] = useState<OperaDetailOut | null>(null);
  const [error, setError] = useState<{ notFound: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    resolveQrCode(code, controller.signal)
      .then((result) => {
        setOpera(result);
        onResolved?.(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) {
          setError({
            notFound: true,
            message: `Il codice "${code}" non corrisponde a nessun bene registrato.`,
          });
          return;
        }
        setError({
          notFound: false,
          message:
            err instanceof Error
              ? err.message
              : "Errore durante la lettura del QR code.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [code, onResolved]);

  if (loading) {
    return (
      <main
        aria-busy="true"
        aria-label="Caricamento opera da codice QR"
        className="min-h-screen bg-museum-bg text-museum-ink flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="museum-glass max-w-md w-full rounded-2xl border border-[#c9a86a]/40 p-6 space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[#c9a86a]/15 border border-[#c9a86a]/45 flex items-center justify-center mx-auto text-[#e4cc9a]">
            <QrCode className="w-5 h-5 animate-pulse" aria-hidden="true" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#c9a86a]">
            Accesso Rapido QR
          </p>
          <h1 className="font-serif-display text-2xl text-white">
            Risoluzione codice {code}…
          </h1>
          <p className="text-xs text-neutral-300">
            Apertura della scheda 2D leggera in corso.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        role="alert"
        className="min-h-screen bg-museum-bg text-museum-ink flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="museum-glass max-w-md w-full rounded-2xl border border-[#c9a86a]/40 p-6 space-y-4">
          <h1 className="font-serif-display text-3xl text-white">
            {error.notFound
              ? "Opera o codice QR non trovato"
              : "Errore di caricamento"}
          </h1>
          <p className="text-sm text-neutral-300">{error.message}</p>
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

  if (!opera) {
    return null;
  }

  return (
    <main className="min-h-screen bg-museum-bg text-museum-ink flex flex-col items-center justify-center p-6 text-center">
      <div className="museum-glass max-w-md w-full rounded-2xl border border-[#c9a86a]/40 p-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a86a]">
          {opera.ente.nome}
        </p>
        <h1 className="font-serif-display text-3xl text-white">{opera.titolo}</h1>
        <p className="text-sm text-neutral-300">
          {opera.autore} — {opera.anno}
        </p>
      </div>
    </main>
  );
}

export default QrResolverPage;
