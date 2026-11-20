import { useEffect, useState } from "react";
import { ApiError, resolveQrCode } from "../../services/apiClient";
import type { OperaDetailOut } from "../../types/api";

export interface QrPageProps {
  /** Codice QR estratto dal route param `/qr/:code` (es. "COG-001"). */
  code: string;
  onResolved?: (opera: OperaDetailOut) => void;
  onBackToMap?: () => void;
}

/**
 * Template pagina deep-link QR (`/qr/[code]`).
 * Risolve `GET /api/v1/qr/{qr_code}` (case-insensitive) e reindirizza o renderizza
 * direttamente la scheda dell'opera.
 *
 * TODO (UI Implementation):
 * - Collegare il parametro `code` da React Router (`useParams<{ code: string }>()`)
 * - Gestire `404 (QR_NOT_FOUND)` con schermata amichevole e bottone "Torna alla mappa"
 * - Reindirizzare a `/opera/${opera.id}` oppure renderizzare `<OperaDetailPage initialOpera={opera} />`
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
            message: "Opera o codice QR non trovato.",
          });
          return;
        }
        setError({
          notFound: false,
          message: err instanceof Error ? err.message : "Errore durante la lettura del QR code.",
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
      <main aria-busy="true" aria-label="Caricamento opera da codice QR">
        <p>Risoluzione codice QR {code} in corso...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main role="alert">
        <h1>{error.notFound ? "Codice QR non trovato" : "Errore di caricamento"}</h1>
        <p>{error.message}</p>
        <button type="button" onClick={onBackToMap}>
          Torna alla mappa
        </button>
      </main>
    );
  }

  if (!opera) {
    return null;
  }

  return (
    <main>
      <p>{opera.ente.nome}</p>
      <h1>{opera.titolo}</h1>
      <p>
        {opera.autore} — {opera.anno}
      </p>
    </main>
  );
}

export default QrResolverPage;
