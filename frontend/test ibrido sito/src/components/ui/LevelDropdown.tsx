import { Check, ChevronDown, GraduationCap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LivelloCompetenza } from "../../types/api";
import { LEVEL_LABELS, LEVEL_OPTIONS } from "../../utils/format";

interface LevelDropdownProps {
  value: LivelloCompetenza;
  onChange: (next: LivelloCompetenza) => void;
}

export function LevelDropdown({ value, onChange }: LevelDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border-2 border-gold-deep/55 bg-panna-soft/70 px-5 text-base font-semibold text-ink transition hover:border-gold-deep hover:bg-panna-soft"
      >
        <GraduationCap className="h-5 w-5 text-gold-deep" aria-hidden="true" />
        <span>
          Livello: <strong className="text-gold-deep">{LEVEL_LABELS[value]}</strong>
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gold-deep transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Scegli il livello di comprensione"
          className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gold-light bg-panna p-2 shadow-2xl sm:w-96"
        >
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">
            Scegli il livello di conoscenza
          </p>
          <div className="divide-y divide-gold-light/50">
            {LEVEL_OPTIONS.map((opt) => {
              const active = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition ${
                    active
                      ? "bg-panna-soft text-ink"
                      : "text-ink hover:bg-panna-soft/60"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-2xl font-semibold text-ink">
                        {opt.label}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
                        {opt.subtitle}
                      </span>
                    </div>
                    <p className="text-sm leading-snug text-ink-secondary">
                      {opt.description}
                    </p>
                  </div>

                  {active && (
                    <Check
                      className="mt-1 h-5 w-5 shrink-0 text-gold-deep"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
