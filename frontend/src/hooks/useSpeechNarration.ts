import { useCallback, useEffect, useState } from "react";

export interface UseSpeechNarrationResult {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (customText?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

/**
 * Hook dedicato alla sintesi vocale tramite Web Speech API.
 * Passare sempre `narrazione.script_audio` (mai `testo_lettura`).
 * Garantisce `window.speechSynthesis.cancel()` sia al cambio livello/testo sia all'unmount.
 */
export function useSpeechNarration(scriptAudio: string | null | undefined): UseSpeechNarrationResult {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  const speak = useCallback(
    (customText?: string) => {
      if (!isSupported) return;
      const textToRead = (customText ?? scriptAudio ?? "").trim();
      if (!textToRead) return;

      // Cancella sempre eventuale audio precedente per evitare sovrapposizioni.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = "it-IT";
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, scriptAudio],
  );

  const pause = useCallback(() => {
    if (!isSupported || !window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported || !window.speechSynthesis.paused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported]);

  // Regola critica: stop immediato al cambio di scriptAudio (es. cambio livello) e all'unmount.
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setIsPaused(false);
    };
  }, [isSupported, scriptAudio]);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    stop,
  };
}
