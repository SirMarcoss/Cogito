import { Check, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import type { LivelloCompetenza } from "../../types/api";
import { LEVEL_OPTIONS } from "../../utils/format";

interface LevelWelcomeModalProps {
  open: boolean;
  onSelect: (level: LivelloCompetenza) => void;
}

export function LevelWelcomeModal({ open, onSelect }: LevelWelcomeModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstOptionRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      firstOptionRef.current?.focus({ preventScroll: true });
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && dialogRef.current) {
        const buttons = Array.from(
          dialogRef.current.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
        );
        if (buttons.length === 0) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-welcome-title"
      className="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto bg-ink/55 p-3 py-6 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-gold-light bg-panna p-5 shadow-2xl sm:p-10">
        <div className="space-y-3 border-b border-gold-light/70 pb-6">
          <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <span>Personalizza la tua visita</span>
          </div>
          <h2
            id="level-welcome-title"
            className="font-serif text-3xl font-semibold text-ink sm:text-5xl"
          >
            Qual è il tuo livello di conoscenza?
          </h2>
          <p className="text-base text-ink-secondary sm:text-lg">
            Le descrizioni AI e l’audioguida verranno calibrate automaticamente
            sul tuo profilo. La scelta verrà salvata su questo dispositivo e
            potrai modificarla in qualsiasi momento dal pulsante in alto a destra.
          </p>
        </div>

        <div className="mt-6 grid gap-3.5 sm:mt-7 sm:grid-cols-2 sm:gap-4">
          {LEVEL_OPTIONS.map((opt, idx) => (
            <button
              key={opt.id}
              ref={idx === 0 ? firstOptionRef : undefined}
              type="button"
              onClick={() => onSelect(opt.id)}
              className="group flex flex-col items-start justify-between gap-2 rounded-2xl border-2 border-gold-light/80 bg-panna-card/70 p-4 text-left transition-all duration-200 hover:border-gold-deep hover:bg-panna-soft focus-visible:border-gold-deep sm:p-5"
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
