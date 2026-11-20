import { Pause, Play, Square, Volume2, VolumeX } from "lucide-react";
import { useSpeechNarration } from "../hooks/useSpeechNarration";

export interface SpeechPlayerBarProps {
  /** Passare sempre e solo `narrazione.script_audio` (mai `testo_lettura`). */
  scriptAudio: string | null | undefined;
}

export function SpeechPlayerBar({ scriptAudio }: SpeechPlayerBarProps) {
  const { isSupported, isSpeaking, isPaused, speak, pause, resume, stop } =
    useSpeechNarration(scriptAudio);

  const hasAudioText = Boolean(scriptAudio && scriptAudio.trim().length > 0);

  if (!isSupported) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-neutral-300"
      >
        <VolumeX className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
        <span>Sintesi vocale non supportata da questo browser.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c9a86a]/30 bg-[#c9a86a]/[0.07] px-3.5 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Volume2 className="w-4 h-4 text-[#e4cc9a] shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#e4cc9a]">Audioguida AI (it-IT)</p>
          <p aria-live="polite" className="text-[11px] text-neutral-300 truncate">
            {isSpeaking
              ? isPaused
                ? "Riproduzione in pausa"
                : "Riproduzione vocale in corso..."
              : "Pronta per l'ascolto accessibile"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isSpeaking ? (
          <button
            type="button"
            disabled={!hasAudioText}
            onClick={() => speak()}
            aria-label="Ascolta narrazione vocale"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] disabled:opacity-40 text-[#0b0b0c] text-xs font-semibold px-3.5 py-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ascolta</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                type="button"
                onClick={resume}
                aria-label="Riprendi narrazione vocale"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] text-xs font-semibold px-3 py-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Riprendi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={pause}
                aria-label="Metti in pausa la narrazione vocale"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-1.5 border border-white/20 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pausa</span>
              </button>
            )}
            <button
              type="button"
              onClick={stop}
              aria-label="Ferma narrazione vocale"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-100 text-xs font-medium px-3 py-1.5 border border-white/20 transition-colors"
            >
              <Square className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Stop</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
