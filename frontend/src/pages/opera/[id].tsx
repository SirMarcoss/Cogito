import { useEffect, useState } from "react";
import { useSpeechNarration } from "../../hooks/useSpeechNarration";
import { useUserLevel } from "../../hooks/useUserLevel";
import {
  ApiError,
  askOperaQuestion,
  getOperaById,
  getOperaNarration,
  getRelatedOpere,
} from "../../services/apiClient";
import type {
  AskResponse,
  CorrelazioneItemOut,
  LivelloCompetenza,
  NarrazioneOut,
  OperaDetailOut,
} from "../../types/api";

export interface OperaPageProps {
  operaId: number;
  initialOpera?: OperaDetailOut | null;
  onBackToMap?: () => void;
}

const LEVELS: readonly { value: LivelloCompetenza; label: string }[] = [
  { value: "bambino", label: "Bambino (6-11)" },
  { value: "ragazzo", label: "Ragazzo (12-17)" },
  { value: "adulto", label: "Adulto" },
  { value: "esperto", label: "Esperto" },
];

/**
 * Template scheda opera (`/opera/[id]`).
 *
 * Flusso obbligatorio da specifica (`docs/FRONTEND_CONTEXT.md`):
 * 1. `GET /api/v1/opere/{id}` immediato (~20ms): mostra foto, titolo, autore,
 *    `descrizione_ufficiale`, dati `ente` e `documento_archivio` (se presente).
 * 2. Se `cogito_user_level` non è in `localStorage`, mostra pop-up/bottom-sheet livello.
 * 3. In parallelo e senza bloccare il rendering, chiama `/narration` e `/related`
 *    con skeleton dedicati.
 * 4. In caso di 502/503 (`AI_SERVICE_UNAVAILABLE`) su `/narration`, fallback su `descrizione_ufficiale`.
 * 5. Sintesi vocale solo su `narrazione.script_audio` con `cancel()` su cambio livello/unmount.
 *
 * TODO (UI Implementation — Ispirazione `docs/inspiration/museo_palazzo_aurelia_galleria_virtuale_3d.html`):
 * - Pannello laterale / schede in stile `museum-glass` con accenti oro `#c9a86a`
 * - Box evidenza archivio (segnatura, fondo, datazione, estratto_verificato, ente_conservazione)
 * - Sezione correlazioni territoriali e widget Q&A (`askOperaQuestion`)
 */
export function OperaDetailPage({ operaId, initialOpera = null, onBackToMap }: OperaPageProps) {
  const { level, hasSelectedLevel, setLevel } = useUserLevel();

  const [opera, setOpera] = useState<OperaDetailOut | null>(initialOpera);
  const [operaError, setOperaError] = useState<string | null>(null);
  const [loadingOpera, setLoadingOpera] = useState(!initialOpera);

  const [narration, setNarration] = useState<NarrazioneOut | null>(null);
  const [loadingNarration, setLoadingNarration] = useState(false);
  const [narrationFallback, setNarrationFallback] = useState(false);

  const [related, setRelated] = useState<CorrelazioneItemOut[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);

  const speech = useSpeechNarration(narration?.script_audio);

  useEffect(() => {
    if (initialOpera && initialOpera.id === operaId) {
      setOpera(initialOpera);
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
          setOperaError("Opera o codice QR non trovato.");
          return;
        }
        setOperaError(err instanceof Error ? err.message : "Errore di caricamento opera.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOpera(false);
      });

    return () => controller.abort();
  }, [operaId, initialOpera]);

  // Caricamento asincrono parallelo di narrazione e correlazioni quando `level` è scelto.
  useEffect(() => {
    if (!opera || !level) return;

    const controller = new AbortController();
    setLoadingNarration(true);
    setNarrationFallback(false);
    setLoadingRelated(true);

    const narrationPromise = getOperaNarration(opera.id, level, controller.signal)
      .then((res) => {
        setNarration(res);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && (err.status === 502 || err.status === 503)) {
          setNarrationFallback(true);
          setNarration(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingNarration(false);
      });

    const relatedPromise = getRelatedOpere(opera.id, 3, controller.signal)
      .then((res) => setRelated(res.correlazioni))
      .catch(() => {
        if (!controller.signal.aborted) setRelated([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRelated(false);
      });

    void Promise.allSettled([narrationPromise, relatedPromise]);

    return () => controller.abort();
  }, [opera, level]);

  const handleSelectLevel = (nextLevel: LivelloCompetenza) => {
    speech.stop();
    setLevel(nextLevel);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opera || !level || question.trim().length < 3) return;
    const result = await askOperaQuestion(opera.id, {
      question: question.trim(),
      livello: level,
    });
    setAnswer(result);
  };

  if (loadingOpera) {
    return (
      <main aria-busy="true">
        <p>Caricamento scheda opera...</p>
      </main>
    );
  }

  if (operaError || !opera) {
    return (
      <main role="alert">
        <h1>Opera non disponibile</h1>
        <p>{operaError ?? "Opera non trovata."}</p>
        <button type="button" onClick={onBackToMap}>
          Torna alla mappa
        </button>
      </main>
    );
  }

  return (
    <main>
      <header>
        <p>
          {opera.ente.nome} ({opera.ente.citta})
        </p>
        <h1>{opera.titolo}</h1>
        <p>
          {opera.autore} • {opera.anno}
        </p>

        {/* Selettore rapido livello in cima alla scheda */}
        <div role="group" aria-label="Livello di narrazione">
          {LEVELS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={level === item.value}
              onClick={() => handleSelectLevel(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Bottom-sheet iniziale se cogito_user_level non è ancora impostato */}
      {!hasSelectedLevel && (
        <section aria-label="Scegli il tuo livello di lettura">
          <h2>Personalizza la guida</h2>
          {LEVELS.map((item) => (
            <button key={item.value} type="button" onClick={() => handleSelectLevel(item.value)}>
              {item.label}
            </button>
          ))}
        </section>
      )}

      <section aria-label="Narrazione adattiva e audio">
        {loadingNarration ? (
          <p aria-busy="true">Preparazione narrazione adattiva...</p>
        ) : narrationFallback || !narration ? (
          <p>{opera.descrizione_ufficiale}</p>
        ) : (
          <>
            <p>{narration.testo_lettura}</p>
            {speech.isSupported && (
              <div>
                <button type="button" onClick={() => speech.speak()}>
                  Ascolta narrazione
                </button>
                <button type="button" onClick={speech.stop}>
                  Ferma audio
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {opera.documento_archivio && (
        <section aria-label="Documento d'archivio collegato">
          <h2>Fonte d&apos;Archivio</h2>
          <p>
            {opera.documento_archivio.segnatura} — {opera.documento_archivio.fondo}
          </p>
          <p>{opera.documento_archivio.estratto_verificato}</p>
        </section>
      )}

      <section aria-label="Opere e luoghi correlati">
        <h2>Beyond the Museum — Connessioni</h2>
        {loadingRelated ? <p>Ricerca connessioni...</p> : <p>{related.length} collegamenti</p>}
      </section>

      <section aria-label="Domande sull'opera">
        <form onSubmit={handleAsk}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Fai una domanda su quest'opera..."
            aria-label="Domanda sull'opera"
          />
          <button type="submit">Chiedi</button>
        </form>
        {answer && <p>{answer.answer}</p>}
      </section>
    </main>
  );
}

export default OperaDetailPage;
