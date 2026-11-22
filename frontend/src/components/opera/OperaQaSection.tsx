import {
  AlertTriangle,
  Loader2,
  MessageCircleQuestion,
  RotateCcw,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { askOperaQuestion, isApiError } from "../../services/apiClient";
import type { AskResponse, LivelloCompetenza } from "../../types/api";
import { LEVEL_LABELS } from "../../utils/format";

interface OperaQaSectionProps {
  operaId: number;
  livello: LivelloCompetenza;
}

interface QaTurn {
  id: string;
  question: string;
  status: "loading" | "done" | "error";
  response?: AskResponse;
  error?: string;
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
  const [turns, setTurns] = useState<QaTurn[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const hasConversation = turns.length > 0;

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setQuestion("");
    setValidationError(null);
    setTurns([]);
  }, [operaId]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setTurns((prev) => prev.filter((t) => t.status !== "loading"));
  }, [livello]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (turns.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const trimmed = question.trim();
  const charCount = trimmed.length;

  const submitQuestion = async (rawQuestion: string) => {
    const clean = rawQuestion.trim();
    setValidationError(null);

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

    const turnId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setQuestion("");
    setTurns((prev) => [
      ...prev.filter((t) => t.status !== "loading"),
      { id: turnId, question: clean, status: "loading" },
    ]);
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
      if (controller.signal.aborted) return;

      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId ? { ...t, status: "done", response: res } : t,
        ),
      );
    } catch (err) {
      if (
        controller.signal.aborted ||
        (err instanceof DOMException && err.name === "AbortError")
      ) {
        return;
      }
      const message = isApiError(err)
        ? err.detail
        : "Servizio domande temporaneamente non disponibile. Riprova tra poco.";
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId ? { ...t, status: "error", error: message } : t,
        ),
      );
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitQuestion(question);
  };

  const handleSuggestedClick = (suggested: string) => {
    void submitQuestion(suggested);
  };

  const handleResetConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setTurns([]);
    setQuestion("");
    setValidationError(null);
  };

  return (
    <aside
      aria-label="Assistente Cogito AI sull’opera"
      className="flex h-full min-h-0 flex-col"
    >
      {/* Top Badge & Intro (compacts once conversation starts) */}
      <div className="shrink-0 space-y-1.5 lg:pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
            <MessageCircleQuestion
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>Cogito AI · {LEVEL_LABELS[livello]}</span>
          </div>

          {hasConversation && (
            <button
              type="button"
              onClick={handleResetConversation}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold-light px-3 py-1 text-xs font-semibold text-ink-secondary transition hover:border-gold-deep hover:bg-panna-soft hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Nuova</span>
            </button>
          )}
        </div>

        {!hasConversation && (
          <>
            <h2
              id="qa-heading"
              className="font-serif text-3xl font-semibold text-ink"
            >
              Chiedi sull’opera
            </h2>
            <p className="text-sm leading-relaxed text-ink-secondary xl:text-base">
              Fai una domanda libera o scegli uno spunto: le risposte si basano
              sulle fonti storiche dell’opera.
            </p>
          </>
        )}
      </div>

      {/* Middle Scrollable Conversation Area */}
      <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1">
        {hasConversation && (
          <div aria-live="polite" className="space-y-5">
            {turns.map((turn) => (
              <div key={turn.id} className="space-y-3">
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm border border-gold-deep/25 bg-gold-deep/10 px-4 py-2.5 text-sm font-medium leading-relaxed text-ink xl:text-[15px]">
                  {turn.question}
                </div>

                <div className="space-y-2.5 border-l-4 border-gold-deep pl-4">
                  {turn.status === "loading" && (
                    <div className="flex items-center gap-2 text-sm text-ink-secondary">
                      <Loader2
                        className="h-4 w-4 animate-spin text-gold-deep"
                        aria-hidden="true"
                      />
                      <span>Consultazione delle fonti storiche…</span>
                    </div>
                  )}

                  {turn.status === "error" && turn.error && (
                    <p className="text-sm font-medium text-[#8A3727] xl:text-base">
                      {turn.error}
                    </p>
                  )}

                  {turn.status === "done" && turn.response && (
                    <>
                      {!turn.response.in_scope && (
                        <div className="flex items-start gap-2 text-xs font-semibold text-[#8A4A1B] xl:text-sm">
                          <AlertTriangle
                            className="mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            Avviso: la domanda sembra fuori tema rispetto a
                            questa opera.
                          </span>
                        </div>
                      )}

                      <p className="text-base leading-relaxed text-ink">
                        {turn.response.answer}
                      </p>

                      {turn.response.fonti_citate.length > 0 && (
                        <p className="text-xs leading-relaxed text-ink-muted xl:text-sm">
                          <span className="font-semibold text-gold-deep">
                            Fonti:{" "}
                          </span>
                          {turn.response.fonti_citate.join(" · ")}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom-Anchored Composer & Initial Suggested Prompts */}
      <div className="mt-auto shrink-0 space-y-3 border-t border-gold-light/50 pt-3">
        {!hasConversation && (
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
        )}

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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!loading) void submitQuestion(question);
              }
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
