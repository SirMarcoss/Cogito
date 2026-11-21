import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechStatus = "idle" | "loading" | "playing" | "paused";
export type SpeechEngineMode = "neural" | "browser";

export interface VoiceChoice {
  id: string;
  label: string;
}

export const NEURAL_VOICES: VoiceChoice[] = [
  { id: "it-IT-IsabellaNeural", label: "Isabella" },
  { id: "it-IT-ElsaNeural", label: "Elsa" },
  { id: "it-IT-GiuseppeMultilingualNeural", label: "Giuseppe" },
  { id: "it-IT-DiegoNeural", label: "Diego" },
];

const MAX_CLIENT_BLOB_CACHE = 24;

interface SpeechSegment {
  text: string;
  pauseAfterMs: number;
}

function getPreferredVoiceShortName(voiceId: string): string {
  const found = NEURAL_VOICES.find((v) => v.id === voiceId);
  return (found?.label ?? "isabella").toLowerCase();
}

function scoreBrowserItalianVoice(
  v: SpeechSynthesisVoice,
  preferredName: string,
): number {
  const lang = v.lang.toLowerCase();
  if (!lang.startsWith("it")) return -1;

  const name = v.name.toLowerCase();
  let score = lang === "it-it" ? 10 : 5;
  if (name.includes("natural")) score += 100;
  if (name.includes("online")) score += 60;
  if (name.includes("google")) score += 45;
  if (name.includes("enhanced") || name.includes("premium")) score += 35;
  if (preferredName && name.includes(preferredName)) score += 80;
  return score;
}

function splitIntoSpeechSegments(rawText: string): SpeechSegment[] {
  const paragraphs = rawText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const segments: SpeechSegment[] = [];
  paragraphs.forEach((paragraph) => {
    const sentences = paragraph
      .split(/(?<=[.!?…])\s+(?=[A-ZÀÈÉÌÒÙ0-9"“«])/)
      .map((s) => s.trim())
      .filter(Boolean);

    sentences.forEach((sentence, idx) => {
      segments.push({
        text: sentence,
        pauseAfterMs: idx === sentences.length - 1 ? 420 : 210,
      });
    });
  });

  if (segments.length === 0 && rawText.trim()) {
    segments.push({ text: rawText.trim(), pauseAfterMs: 0 });
  }
  return segments;
}

export function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function useSpeechGuide() {
  const hasBrowserSpeech =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined";

  const supported =
    typeof window !== "undefined" &&
    (typeof Audio !== "undefined" || hasBrowserSpeech);

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [engineMode, setEngineMode] = useState<SpeechEngineMode>("neural");
  const [progress, setProgress] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    NEURAL_VOICES[0].id,
  );

  // Single persistent HTMLAudioElement & Blob cache for clean, instantaneous voice switching
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const blobCacheRef = useRef<Map<string, Blob>>(new Map());

  // Refs for browser Web Speech fallback & race-free session guards
  const sessionIdRef = useRef(0);
  const engineModeRef = useRef<SpeechEngineMode>("neural");
  const segmentsRef = useRef<SpeechSegment[]>([]);
  const indexRef = useRef(0);
  const pauseTimerRef = useRef<number | null>(null);
  const waitingBetweenSegmentsRef = useRef(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const voiceRef = useRef(selectedVoiceId);
  voiceRef.current = selectedVoiceId;

  const setEngineModeSynced = useCallback((mode: SpeechEngineMode) => {
    engineModeRef.current = mode;
    setEngineMode(mode);
  }, []);

  const getOrCreateAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.playbackRate = 1.0;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const clearPauseTimerOnly = useCallback(() => {
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  const clearBrowserFallbackTimers = useCallback(() => {
    clearPauseTimerOnly();
    waitingBetweenSegmentsRef.current = false;
  }, [clearPauseTimerOnly]);

  const cancelBrowserSpeechCleanly = useCallback(() => {
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onstart = null;
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }
    if (hasBrowserSpeech) {
      window.speechSynthesis.cancel();
    }
  }, [hasBrowserSpeech]);

  const cleanupAudioElement = useCallback(() => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
      fetchAbortRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.onloadedmetadata = null;
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
      try {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      } catch {
        // Ignore media reset errors
      }
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    sessionIdRef.current += 1;
    clearBrowserFallbackTimers();
    cancelBrowserSpeechCleanly();
    cleanupAudioElement();

    segmentsRef.current = [];
    indexRef.current = 0;
    setProgress(0);
    setCurrentTimeSec(0);
    setDurationSec(0);
    setStatus("idle");
  }, [
    clearBrowserFallbackTimers,
    cancelBrowserSpeechCleanly,
    cleanupAudioElement,
  ]);

  const speakFallbackSegmentAt = useCallback(
    (idx: number, sessionId: number, voiceId: string) => {
      if (!hasBrowserSpeech || sessionId !== sessionIdRef.current) return;

      const list = segmentsRef.current;
      if (idx >= list.length) {
        setProgress(100);
        setStatus("idle");
        segmentsRef.current = [];
        indexRef.current = 0;
        activeUtteranceRef.current = null;
        return;
      }

      indexRef.current = idx;
      const seg = list[idx];
      const utterance = new SpeechSynthesisUtterance(seg.text);
      utterance.lang = "it-IT";
      utterance.rate = 1.0;
      utterance.pitch = 1.02;

      const preferredShort = getPreferredVoiceShortName(voiceId);
      const italianVoices = window.speechSynthesis
        .getVoices()
        .map((v) => ({ v, score: scoreBrowserItalianVoice(v, preferredShort) }))
        .filter((item) => item.score >= 0)
        .sort((a, b) => b.score - a.score);
      if (italianVoices[0]) {
        utterance.voice = italianVoices[0].v;
      }

      utterance.onstart = () => {
        if (sessionId === sessionIdRef.current) {
          setStatus("playing");
          setProgress(Math.round((idx / Math.max(1, list.length)) * 100));
        }
      };

      utterance.onend = () => {
        if (sessionId !== sessionIdRef.current) return;
        const nextIdx = idx + 1;
        setProgress(Math.round((nextIdx / Math.max(1, list.length)) * 100));

        if (nextIdx >= list.length) {
          setStatus("idle");
          segmentsRef.current = [];
          indexRef.current = 0;
          activeUtteranceRef.current = null;
          return;
        }

        clearPauseTimerOnly();
        waitingBetweenSegmentsRef.current = true;
        pauseTimerRef.current = window.setTimeout(() => {
          waitingBetweenSegmentsRef.current = false;
          if (sessionId === sessionIdRef.current) {
            speakFallbackSegmentAt(nextIdx, sessionId, voiceId);
          }
        }, seg.pauseAfterMs);
      };

      utterance.onerror = () => {
        if (sessionId === sessionIdRef.current) {
          activeUtteranceRef.current = null;
          setStatus("idle");
        }
      };

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [hasBrowserSpeech, clearPauseTimerOnly],
  );

  const playBrowserFallback = useCallback(
    (cleanText: string, sessionId: number, voiceId: string) => {
      if (!hasBrowserSpeech || sessionId !== sessionIdRef.current) {
        if (sessionId === sessionIdRef.current) setStatus("idle");
        return;
      }
      setEngineModeSynced("browser");
      cancelBrowserSpeechCleanly();
      const segs = splitIntoSpeechSegments(cleanText);
      segmentsRef.current = segs;
      indexRef.current = 0;
      setProgress(0);
      setStatus("playing");
      speakFallbackSegmentAt(0, sessionId, voiceId);
    },
    [
      hasBrowserSpeech,
      setEngineModeSynced,
      cancelBrowserSpeechCleanly,
      speakFallbackSegmentAt,
    ],
  );

  const play = useCallback(
    (rawText: string, voiceOverride?: string) => {
      const clean = rawText.trim();
      if (!supported || !clean) return;

      stop();
      const mySession = sessionIdRef.current;
      const targetVoice = voiceOverride ?? voiceRef.current;

      setStatus("loading");
      setEngineModeSynced("neural");

      // Synchronously prepare/unlock single persistent Audio element inside user click gesture
      const audio = getOrCreateAudio();
      try {
        audio.pause();
        audio.playbackRate = 1.0;
      } catch {
        // Ignore
      }

      const controller = new AbortController();
      fetchAbortRef.current = controller;
      const cacheKey = `${targetVoice}:${clean}`;

      void (async () => {
        let blob: Blob;
        try {
          const cachedBlob = blobCacheRef.current.get(cacheKey);
          if (cachedBlob) {
            blobCacheRef.current.delete(cacheKey);
            blobCacheRef.current.set(cacheKey, cachedBlob);
            blob = cachedBlob;
          } else {
            const res = await fetch("/api/local-tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: clean, voice: targetVoice }),
              signal: controller.signal,
            });

            if (!res.ok) {
              throw new Error(`TTS HTTP ${res.status}`);
            }

            blob = await res.blob();
            if (mySession !== sessionIdRef.current || controller.signal.aborted) {
              return;
            }

            if (blobCacheRef.current.size >= MAX_CLIENT_BLOB_CACHE) {
              const oldestKey = blobCacheRef.current.keys().next().value;
              if (oldestKey) blobCacheRef.current.delete(oldestKey);
            }
            blobCacheRef.current.set(cacheKey, blob);
          }
        } catch (err) {
          if (
            controller.signal.aborted ||
            (err instanceof DOMException && err.name === "AbortError") ||
            mySession !== sessionIdRef.current
          ) {
            return;
          }
          // Only fall back to browser speech when the /api/local-tts endpoint itself is unreachable
          cleanupAudioElement();
          playBrowserFallback(clean, mySession, targetVoice);
          return;
        }

        if (mySession !== sessionIdRef.current || controller.signal.aborted) {
          return;
        }

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        audio.onloadedmetadata = () => {
          if (
            mySession === sessionIdRef.current &&
            objectUrlRef.current === url &&
            Number.isFinite(audio.duration)
          ) {
            setDurationSec(audio.duration);
          }
        };

        audio.ontimeupdate = () => {
          if (
            mySession !== sessionIdRef.current ||
            objectUrlRef.current !== url
          ) {
            return;
          }
          setCurrentTimeSec(audio.currentTime || 0);
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setDurationSec(audio.duration);
            setProgress(
              Math.min(100, Math.round((audio.currentTime / audio.duration) * 100)),
            );
          }
        };

        audio.onended = () => {
          if (
            mySession !== sessionIdRef.current ||
            objectUrlRef.current !== url
          ) {
            return;
          }
          setProgress(100);
          setStatus("idle");
        };

        audio.onerror = () => {
          if (
            mySession !== sessionIdRef.current ||
            objectUrlRef.current !== url
          ) {
            return;
          }
          // Reset cleanly instead of ambushing the user with a robotic browser voice mid-switch
          cleanupAudioElement();
          setStatus("idle");
        };

        audio.src = url;
        audio.currentTime = 0;

        try {
          await audio.play();
          if (
            mySession !== sessionIdRef.current ||
            objectUrlRef.current !== url
          ) {
            if (audio.src === url) {
              audio.pause();
            }
            return;
          }
          setStatus("playing");
        } catch (err) {
          if (
            mySession !== sessionIdRef.current ||
            objectUrlRef.current !== url
          ) {
            return;
          }
          if (err instanceof DOMException && err.name === "NotAllowedError") {
            // Keep prepared audio in paused state so user can tap Riprendi cleanly without falling back to robotic voice
            setStatus("paused");
            return;
          }
          cleanupAudioElement();
          setStatus("idle");
        }
      })();
    },
    [
      supported,
      stop,
      setEngineModeSynced,
      getOrCreateAudio,
      cleanupAudioElement,
      playBrowserFallback,
    ],
  );

  const pause = useCallback(() => {
    if (engineModeRef.current === "neural" && audioRef.current) {
      audioRef.current.pause();
      setStatus("paused");
      return;
    }
    if (!hasBrowserSpeech) return;
    if (waitingBetweenSegmentsRef.current) {
      clearPauseTimerOnly();
      setStatus("paused");
      return;
    }
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setStatus("paused");
    }
  }, [hasBrowserSpeech, clearPauseTimerOnly]);

  const resume = useCallback(() => {
    if (engineModeRef.current === "neural" && audioRef.current) {
      const mySession = sessionIdRef.current;
      const activeUrl = objectUrlRef.current;
      audioRef.current.playbackRate = 1.0;
      void audioRef.current
        .play()
        .then(() => {
          if (
            mySession === sessionIdRef.current &&
            objectUrlRef.current === activeUrl
          ) {
            setStatus("playing");
          }
        })
        .catch(() => {
          if (mySession === sessionIdRef.current) {
            cleanupAudioElement();
            setStatus("idle");
          }
        });
      return;
    }
    if (!hasBrowserSpeech) return;
    if (waitingBetweenSegmentsRef.current) {
      waitingBetweenSegmentsRef.current = false;
      setStatus("playing");
      speakFallbackSegmentAt(
        indexRef.current + 1,
        sessionIdRef.current,
        voiceRef.current,
      );
      return;
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus("playing");
    }
  }, [hasBrowserSpeech, cleanupAudioElement, speakFallbackSegmentAt]);

  const selectVoice = useCallback((voiceId: string) => {
    setSelectedVoiceId(voiceId);
    voiceRef.current = voiceId;
  }, []);

  useEffect(() => {
    const cache = blobCacheRef.current;
    return () => {
      sessionIdRef.current += 1;
      clearBrowserFallbackTimers();
      cancelBrowserSpeechCleanly();
      cleanupAudioElement();
      audioRef.current = null;
      cache.clear();
    };
  }, [
    clearBrowserFallbackTimers,
    cancelBrowserSpeechCleanly,
    cleanupAudioElement,
  ]);

  return {
    supported,
    status,
    engineMode,
    progress,
    currentTimeSec,
    durationSec,
    voices: NEURAL_VOICES,
    selectedVoiceId,
    selectVoice,
    play,
    pause,
    resume,
    stop,
  };
}
