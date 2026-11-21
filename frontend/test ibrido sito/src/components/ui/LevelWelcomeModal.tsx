import { Check, Sparkles } from "lucide-react";
import type { LivelloCompetenza } from "../../types/api";
import { LEVEL_OPTIONS } from "../../utils/format";

interface LevelWelcomeModalProps {
  open: boolean;
  onSelect: (level: LivelloCompetenza) => void;
}

export function LevelWelcomeModal({ open, onSelect }: LevelWelcomeModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-welcome-title"
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm sm:p-6"
    >
      <div className="w-full max-w-3xl rounded-3xl border border-gold-light bg-panna p-7 shadow-2xl sm:p-10">
        <div className="space-y-3 border-b border-gold-light/70 pb-6">
          <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <span>Personalizza la tua visita</span>
          </div>
          <h2
            id="level-welcome-title"
            className="font-serif text-4xl font-semibold text-ink sm:text-5xl"
          >
            Qual è il tuo livello di conoscenza?
          </h2>
          <p className="text-lg text-ink-secondary">
            Le descrizioni AI e l’audioguida verranno calibrate automaticamente
            sul tuo profilo. La scelta verrà salvata su questo dispositivo e
            potrai modificarla in qualsiasi momento dal pulsante in alto a destra.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className="group flex flex-col items-start justify-between gap-2 rounded-2xl border-2 border-gold-light/80 bg-panna-card/70 p-5 text-left transition-all duration-200 hover:border-gold-deep hover:bg-panna-soft focus-visible:border-gold-deep"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-serif text-3xl font-semibold text-ink group-hover:text-gold-deep">
                  {opt.label}
                </span>
                <span className="rounded-full bg-panna-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-deep group-hover:bg-gold-deep group-hover:text-panna-card">
                  {opt.subtitle}
                </span>
              </div>
              <p className="text-base leading-snug text-ink-secondary">
                {opt.description}
              </p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-deep opacity-85 group-hover:opacity-100">
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Seleziona questo livello</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
