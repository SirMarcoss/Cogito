import { AudioLines, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { VoiceChoice } from "../../hooks/useSpeechGuide";

interface VoicePickerDropdownProps {
  voices: VoiceChoice[];
  value: string;
  onChange: (voiceId: string) => void;
}

/** Refined rounded voice selector matching the Museum panna/gold design language. */
export function VoicePickerDropdown({
  voices,
  value,
  onChange,
}: VoicePickerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedLabel =
    voices.find((v) => v.id === value)?.label ?? voices[0]?.label ?? "Isabella";

  useEffect(() => {
    if (!open) return;

    const activeIdx = Math.max(
      0,
      voices.findIndex((v) => v.id === value),
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
  }, [open, value, voices]);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const vw = window.innerWidth || 1024;
        const menuW = 208;
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
    const count = voices.length;
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
        aria-label={`Seleziona voce narrante: ${selectedLabel}`}
        onClick={toggleOpen}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold-deep/45 bg-panna-soft/75 px-4 py-2 text-sm font-semibold text-ink transition hover:border-gold-deep hover:bg-panna-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep"
      >
        <AudioLines className="h-4 w-4 text-gold-deep" aria-hidden="true" />
        <span>
          Voce: <strong className="font-semibold text-gold-deep">{selectedLabel}</strong>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gold-deep transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Seleziona voce narrante"
          className={`absolute z-50 mt-2.5 w-52 max-w-[calc(100vw-2rem)] rounded-2xl border border-gold-light bg-panna p-1.5 shadow-xl ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
            Scegli la voce
          </p>
          <div className="space-y-0.5">
            {voices.map((v, idx) => {
              const active = v.id === value;
              return (
                <button
                  key={v.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onKeyDown={(e) => handleItemKeyDown(e, idx)}
                  onClick={() => {
                    onChange(v.id);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-base font-medium transition ${
                    active
                      ? "bg-panna-soft text-ink"
                      : "text-ink-secondary hover:bg-panna-soft/60 hover:text-ink"
                  }`}
                >
                  <span>{v.label}</span>
                  {active && (
                    <Check
                      className="h-4 w-4 shrink-0 text-gold-deep"
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
