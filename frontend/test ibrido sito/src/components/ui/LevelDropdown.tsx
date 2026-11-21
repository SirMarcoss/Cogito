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
  const [alignRight, setAlignRight] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;

    const activeIdx = Math.max(
      0,
      LEVEL_OPTIONS.findIndex((o) => o.id === value),
    );
    const focusTimer = window.setTimeout(() => {
      itemRefs.current[activeIdx]?.focus();
    }, 0);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, value]);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const vw = window.innerWidth || 1024;
        const menuW = vw >= 640 ? 384 : 320;
        const canFitRight = rect.right >= menuW + 16;
        const wouldClipLeftAligned = rect.left + menuW > vw - 16;
        setAlignRight(canFitRight && (wouldClipLeftAligned || rect.left > vw / 2));
      }
      return next;
    });
  };

  const handleItemKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) => {
    const count = LEVEL_OPTIONS.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[(idx + 1) % count]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[(idx - 1 + count) % count]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itemRefs.current[count - 1]?.focus();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleOpen}
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
          className={`absolute z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-gold-light bg-panna p-2 shadow-2xl sm:w-96 ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">
            Scegli il livello di conoscenza
          </p>
          <div className="divide-y divide-gold-light/50">
            {LEVEL_OPTIONS.map((opt, idx) => {
              const active = opt.id === value;
              return (
                <button
                  key={opt.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onKeyDown={(e) => handleItemKeyDown(e, idx)}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                    triggerRef.current?.focus();
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
