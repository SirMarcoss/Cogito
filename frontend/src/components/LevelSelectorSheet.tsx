import { Sparkles } from "lucide-react";
import type { LivelloCompetenza } from "../types/api";

export interface LevelOption {
  value: LivelloCompetenza;
  label: string;
  shortLabel: string;
  description: string;
}

export const LEVEL_OPTIONS: readonly LevelOption[] = [
  {
    value: "bambino",
    label: "Bambino (6–11 anni)",
    shortLabel: "Bambino",
    description: "Storytelling semplice, tono curioso e accessibile.",
  },
  {
    value: "ragazzo",
    label: "Ragazzo (12–17 anni)",
    shortLabel: "Ragazzo",
    description: "Racconto diretto e dinamico con collegamenti visivi.",
  },
  {
    value: "adulto",
    label: "Adulto",
    shortLabel: "Adulto",
    description: "Narrazione culturale equilibrata tra storia e contesto.",
  },
  {
    value: "esperto",
    label: "Esperto",
    shortLabel: "Esperto",
    description: "Rigore storico, metadati archivistici e lettura critica.",
  },
];

export interface LevelSelectorSheetProps {
  isOpen: boolean;
  onSelect: (level: LivelloCompetenza) => void;
}

export function LevelSelectorSheet({ isOpen, onSelect }: LevelSelectorSheetProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-sheet-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6"
    >
      <div className="museum-glass w-full max-w-lg rounded-2xl border border-[#c9a86a]/40 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-[#c9a86a] text-xs uppercase tracking-[0.24em] mb-2">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Guida Adattiva</span>
        </div>
        <h2
          id="level-sheet-title"
          className="font-serif-display text-2xl sm:text-3xl font-medium text-white"
        >
          Scegli il tuo livello di lettura
        </h2>
        <p className="text-sm text-neutral-300 mt-1 mb-5">
          Personalizza subito narrazione e sintesi vocale senza bisogno di registrazione. Potrai cambiare scelta in qualsiasi momento.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LEVEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="text-left rounded-xl p-4 bg-white/[0.04] hover:bg-[#c9a86a]/15 border border-white/15 hover:border-[#c9a86a]/65 transition-all"
            >
              <span className="block font-medium text-sm text-[#e4cc9a]">
                {option.label}
              </span>
              <span className="block text-xs text-neutral-300 mt-1 leading-relaxed">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface LevelSwitcherBarProps {
  currentLevel: LivelloCompetenza | null;
  onSelect: (level: LivelloCompetenza) => void;
  compact?: boolean;
}

export function LevelSwitcherBar({
  currentLevel,
  onSelect,
  compact = false,
}: LevelSwitcherBarProps) {
  return (
    <div
      role="group"
      aria-label="Livello di narrazione"
      className="flex flex-wrap gap-1.5"
    >
      {LEVEL_OPTIONS.map((option) => {
        const active = currentLevel === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
              active
                ? "bg-[#c9a86a] text-[#0b0b0c] border-[#e4cc9a]"
                : "bg-white/[0.04] text-neutral-200 border-white/15 hover:border-[#c9a86a]/55 hover:text-white"
            }`}
          >
            {compact ? option.shortLabel : option.label}
          </button>
        );
      })}
    </div>
  );
}
