import { AlertTriangle, MessageCircleQuestion, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { askOperaQuestion, isApiError } from "../../services/apiClient";
import type { AskResponse, LivelloCompetenza } from "../../types/api";
import { LEVEL_LABELS } from "../../utils/format";

interface OperaQaSectionProps {
  operaId: number;
  livello: LivelloCompetenza;
}

const SUGGESTED_QUESTIONS = [
  "Perché questa opera è così importante?",
  "Qual è il suo contesto storico e documentario?",
  "Quali dettagli dovrei osservare da vicino?",
];

export function OperaQaSection({ operaId, livello }: OperaQaSectionProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setQuestion("");
    setValidationError(null);
    setRequestError(null);
    setResponse(null);
  }, [operaId]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, [livello]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const trimmed = question.trim();
  const charCount = trimmed.length;

  const submitQuestion = async (rawQuestion: string) => {
    const clean = rawQuestion.trim();
    setValidationError(null);
    setRequestError(null);

    if (clean.length < 3) {
      setValidationError(
        "Scrivi almeno 3 caratteri per inviare una domanda sull’opera.",
      );
      return;
    }
    if (clean.length > 300) {
      setValidationError("La domanda non può superare i 300 caratteri.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await askOperaQuestion(
        operaId,
        {
          question: clean,
          livello,
        },
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setResponse(res);
      }
    } catch (err) {
      if (
        controller.signal.aborted ||
        (err instanceof DOMException && err.name === "AbortError")
      ) {
        return;
      }
      setRequestError(
        isApiError(err)
          ? err.detail
          : "Servizio domande temporaneamente non disponibile. Riprova tra poco.",
      );
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitQuestion(question);
  };

  const handleSuggestedClick = (suggested: string) => {
    setQuestion(suggested);
    void submitQuestion(suggested);
  };

  return (
    <aside
      aria-labelledby="qa-heading"
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
          <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
          <span>Assistente AI · {LEVEL_LABELS[livello]}</span>
        </div>
        <h2
          id="qa-heading"
          className="font-serif text-4xl font-semibold text-ink"
        >
          Chiedi sull’opera
        </h2>
        <p className="text-base leading-relaxed text-ink-secondary">
          Fai una domanda libera o scegli uno spunto: le risposte si basano sulle
          fonti storiche dell’opera.
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-col gap-2.5">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading}
            onClick={() => handleSuggestedClick(q)}
            className="inline-flex min-h-[48px] w-full items-center rounded-2xl border border-gold-deep/35 px-4 py-2.5 text-left text-base font-medium text-ink transition hover:border-gold-deep hover:bg-panna-soft disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Free-text Question Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
        <label htmlFor="opera-qa-input" className="sr-only">
          Scrivi una domanda sull’opera (tra 3 e 300 caratteri)
        </label>
        <textarea
          id="opera-qa-input"
          rows={3}
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            if (validationError) setValidationError(null);
          }}
          maxLength={320}
          placeholder="Scrivi qui la tua domanda (3–300 caratteri)…"
          className="w-full resize-none border-b-2 border-gold-deep/50 bg-transparent px-1 py-2 text-lg text-ink placeholder:text-ink-muted/65 focus:border-gold-deep focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep focus-visible:rounded-sm"
        />

        <div className="flex items-center justify-between gap-2 text-sm">
          <span
            className={
              charCount > 300 ? "font-semibold text-[#8A3727]" : "text-ink-muted"
            }
          >
            {charCount} / 300 caratteri
          </span>
          {validationError && (
            <span className="font-semibold text-[#8A3727]">
              {validationError}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-museum-primary w-full"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
          <span>{loading ? "Elaborazione…" : "Invia domanda"}</span>
        </button>
      </form>

      {requestError && (
        <p className="text-base font-medium text-[#8A3727]">{requestError}</p>
      )}

      {/* Grounded Answer */}
      {response && (
        <div
          aria-live="polite"
          className="space-y-3.5 border-l-4 border-gold-deep pl-5 pt-1"
        >
          {!response.in_scope && (
            <div className="flex items-start gap-2.5 text-sm font-semibold text-[#8A4A1B]">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <span>
                Avviso: la domanda sembra fuori tema rispetto a questa opera.
              </span>
            </div>
          )}

          <p className="text-lg leading-relaxed text-ink">{response.answer}</p>

          {response.fonti_citate.length > 0 && (
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-gold-deep">Fonti: </span>
              {response.fonti_citate.join(" · ")}
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
