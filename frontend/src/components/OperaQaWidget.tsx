import { useState } from "react";
import { AlertTriangle, MessageSquare, Send } from "lucide-react";
import { askOperaQuestion } from "../services/apiClient";
import type { AskResponse, LivelloCompetenza } from "../types/api";

export interface OperaQaWidgetProps {
  operaId: number;
  livello: LivelloCompetenza;
}

const MIN_LEN = 3;
const MAX_LEN = 300;

export function OperaQaWidget({ operaId, livello }: OperaQaWidgetProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const trimmed = question.trim();
  const trimmedLength = trimmed.length;
  const isTooShort = trimmedLength < MIN_LEN;
  const isTooLong = trimmedLength > MAX_LEN;
  const isValid = !isTooShort && !isTooLong;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);
    try {
      const response = await askOperaQuestion(operaId, {
        question: trimmed,
        livello,
      });
      setAnswer(response);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Servizio domande momentaneamente non disponibile.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-label="Domande sull'opera"
      className="museum-card rounded-2xl p-4 sm:p-5 space-y-3"
    >
      <div className="flex items-center gap-2 text-[#e4cc9a]">
        <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">
          Chiedi alla Guida AI
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
        <div>
          <label htmlFor={`qa-input-${operaId}`} className="sr-only">
            Fai una domanda su quest&apos;opera (da 3 a 300 caratteri)
          </label>
          <textarea
            id={`qa-input-${operaId}`}
            rows={2}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (!touched && e.target.value.length > 0) {
                setTouched(true);
              }
            }}
            placeholder="Es. Perché la lava del 1669 non distrusse il Castello Ursino?"
            aria-invalid={isTooLong || (touched && isTooShort)}
            aria-describedby={`qa-counter-${operaId}`}
            className="w-full rounded-xl bg-black/40 border border-white/15 focus:border-[#c9a86a] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-400 resize-none"
          />
          <div
            id={`qa-counter-${operaId}`}
            className="mt-1 flex items-center justify-between text-[11px]"
          >
            <span
              className={
                isTooLong || (touched && isTooShort)
                  ? "text-amber-300"
                  : "text-neutral-400"
              }
            >
              {isTooLong
                ? "Superato il limite massimo di 300 caratteri."
                : touched && isTooShort
                  ? "Inserisci almeno 3 caratteri per inviare la domanda."
                  : "Risposta ancorata a scheda e fonti d'archivio"}
            </span>
            <span
              className={`font-mono ${
                isTooLong ? "text-amber-300 font-semibold" : "text-neutral-300"
              }`}
            >
              {trimmedLength}/{MAX_LEN}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className="inline-flex items-center gap-2 rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] disabled:opacity-45 disabled:cursor-not-allowed text-[#0b0b0c] font-semibold text-xs px-4 py-2 transition-colors"
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{loading ? "Consultazione fonti..." : "Invia domanda"}</span>
        </button>
      </form>

      {error && (
        <p role="alert" className="text-xs text-red-300 bg-red-950/50 border border-red-400/30 rounded-xl p-3">
          {error}
        </p>
      )}

      {answer && (
        <div
          role={answer.in_scope ? "region" : "status"}
          aria-live="polite"
          className={`rounded-xl p-3.5 border space-y-2 ${
            answer.in_scope
              ? "bg-white/[0.04] border-[#c9a86a]/35"
              : "bg-amber-950/40 border-amber-400/60"
          }`}
        >
          {!answer.in_scope && (
            <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Domanda fuori contesto rispetto a quest&apos;opera</span>
            </div>
          )}
          <p className="text-sm text-neutral-100 leading-relaxed">{answer.answer}</p>
          {answer.fonti_citate.length > 0 && (
            <p className="text-[11px] text-neutral-400 pt-1 border-t border-white/10">
              Fonti: {answer.fonti_citate.join(" • ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
