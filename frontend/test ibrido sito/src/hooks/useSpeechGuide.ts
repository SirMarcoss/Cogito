import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechStatus = "idle" | "playing" | "paused";

function pickItalianVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  if (!voices.length) return null;

  const exactIt = voices.find((v) => v.lang.toLowerCase() === "it-it");
  if (exactIt) return exactIt;

  const anyIt = voices.find((v) => v.lang.toLowerCase().startsWith("it"));
  return anyIt ?? null;
}

export function useSpeechGuide() {
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined";

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (!supported) {
      setStatus("idle");
      return;
    }
    activeUtteranceRef.current = null;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, [supported]);

  const play = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!supported || !text) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "it-IT";
      utterance.rate = 0.98;
      utterance.pitch = 1;

      const voice = pickItalianVoice(window.speechSynthesis);
      if (voice) {
        utterance.voice = voice;
      }

      activeUtteranceRef.current = utterance;

      utterance.onstart = () => {
        if (activeUtteranceRef.current === utterance) {
          setStatus("playing");
        }
      };
      utterance.onpause = () => {
        if (activeUtteranceRef.current === utterance) {
          setStatus("paused");
        }
      };
      utterance.onresume = () => {
        if (activeUtteranceRef.current === utterance) {
          setStatus("playing");
        }
      };
      utterance.onend = () => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null;
          setStatus("idle");
        }
      };
      utterance.onerror = () => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null;
          setStatus("idle");
        }
      };

      setStatus("playing");
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setStatus("paused");
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus("playing");
    }
  }, [supported]);

  useEffect(() => {
    return () => {
      if (supported) {
        activeUtteranceRef.current = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  return {
    supported,
    status,
    play,
    pause,
    resume,
    stop,
  };
}
