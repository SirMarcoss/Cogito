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
      className="flex h-full min-h-0 flex-col"
    >
      {/* Top Intro */}
      <div className="shrink-0 space-y-1.5 lg:pt-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
          <MessageCircleQuestion className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Cogito AI · {LEVEL_LABELS[livello]}</span>
        </div>
        <h2
          id="qa-heading"
          className="font-serif text-3xl font-semibold text-ink"
        >
          Chiedi sull’opera
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary xl:text-base">
          Fai una domanda libera o scegli uno spunto: le risposte si basano sulle
          fonti storiche dell’opera.
        </p>
      </div>

      {/* Middle Airy Canvas & Scrollable Grounded Answer */}
      <div className="min-h-[1.5rem] flex-1 overflow-y-auto py-4 pr-1">
        {requestError && (
          <p className="text-sm font-medium text-[#8A3727] xl:text-base">
            {requestError}
          </p>
        )}

        {response && (
          <div
            aria-live="polite"
            className="space-y-3 border-l-4 border-gold-deep pl-4"
          >
            {!response.in_scope && (
              <div className="flex items-start gap-2 text-xs font-semibold text-[#8A4A1B] xl:text-sm">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Avviso: la domanda sembra fuori tema rispetto a questa opera.
                </span>
              </div>
            )}

            <p className="text-base leading-relaxed text-ink">{response.answer}</p>

            {response.fonti_citate.length > 0 && (
              <p className="text-xs leading-relaxed text-ink-muted xl:text-sm">
                <span className="font-semibold text-gold-deep">Fonti: </span>
                {response.fonti_citate.join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom-Anchored Prompts & Composer */}
      <div className="mt-auto shrink-0 space-y-3 border-t border-gold-light/50 pt-4">
        <div className="flex flex-col gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => handleSuggestedClick(q)}
              className="inline-flex min-h-[42px] w-full items-center rounded-2xl border border-gold-deep/35 px-3.5 py-2 text-left text-sm font-medium text-ink transition hover:border-gold-deep hover:bg-panna-soft disabled:opacity-50 xl:text-[15px]"
            >
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 pt-0.5">
          <label htmlFor="opera-qa-input" className="sr-only">
            Scrivi una domanda sull’opera (tra 3 e 300 caratteri)
          </label>
          <textarea
            id="opera-qa-input"
            rows={2}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (validationError) setValidationError(null);
            }}
            maxLength={320}
            placeholder="Scrivi qui la tua domanda (3–300 caratteri)…"
            className="w-full resize-none border-b-2 border-gold-deep/50 bg-transparent px-1 py-1.5 text-base text-ink placeholder:text-ink-muted/65 focus:border-gold-deep focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep focus-visible:rounded-sm"
          />

          <div className="flex items-center justify-between gap-2 text-xs xl:text-sm">
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
            className="btn-museum-primary min-h-[46px] w-full py-2.5 text-base"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{loading ? "Elaborazione…" : "Invia domanda"}</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
