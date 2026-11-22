import { ArrowRight, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildNeoclassicalMuseum,
  MuseumBuildAbortedError,
  type MuseumRenderStats,
  type NeoclassicalMuseumHandle,
} from "./museumGeometry";

interface MuseumLanding3DProps {
  onEnter: () => void;
}

export function MuseumLanding3D({ onEnter }: MuseumLanding3DProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<NeoclassicalMuseumHandle | null>(null);

  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const enteredRef = useRef(false);
  const enterTimeoutRef = useRef<number | null>(null);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  const [webglUnsupported, setWebglUnsupported] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [hintOpacity, setHintOpacity] = useState(1);
  const [loadProgress, setLoadProgress] = useState(4);
  const [loadLabel, setLoadLabel] = useState("Preparazione del museo 3D…");
  const [loaderFadingOut, setLoaderFadingOut] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);

  const resetScrollInstant = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const completeEntry = useCallback(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    setFadeOpacity(1);
    document.body.style.overflow = "hidden";
    resetScrollInstant();

    enterTimeoutRef.current = window.setTimeout(() => {
      enterTimeoutRef.current = null;
      handleRef.current?.dispose();
      handleRef.current = null;
      document.body.style.overflow = "";
      resetScrollInstant();
      onEnterRef.current();
    }, 340);
  }, [resetScrollInstant]);

  useEffect(() => {
    if (!loaderVisible || webglUnsupported) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [loaderVisible, webglUnsupported]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const abortController = new AbortController();
    let museumHandle: NeoclassicalMuseumHandle | null = null;
    let rafId = 0;
    let revealHoldTimer: number | null = null;
    let revealUnmountTimer: number | null = null;
    let listenersAttached = false;

    const updateScrollTarget = () => {
      const track = trackRef.current;
      if (!track || enteredRef.current) return;
      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
      const scrolled = Math.min(scrollable, Math.max(0, -rect.top));
      const p = Math.min(1, Math.max(0, scrolled / scrollable));

      targetProgressRef.current = p;

      if (p >= 0.84) {
        setFadeOpacity(Math.min(1, (p - 0.84) / 0.14));
      } else {
        setFadeOpacity(0);
      }

      setHintOpacity(Math.max(0, 1 - p * 3.8));

      if (p >= 0.98) {
        completeEntry();
      }
    };

    const handleResize = () => {
      museumHandle?.resize();
      updateScrollTarget();
    };

    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current.x =
        (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointerRef.current.y =
        -(e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setLoaderVisible(false);
      setWebglUnsupported(true);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);

    const initMuseum = async () => {
      try {
        museumHandle = await buildNeoclassicalMuseum(canvas, {
          signal: abortController.signal,
          onProgress: ({ progress, label }) => {
            if (abortController.signal.aborted) return;
            setLoadProgress((prev) => Math.max(prev, progress));
            setLoadLabel(label);
          },
        });

        if (abortController.signal.aborted) {
          museumHandle.dispose();
          museumHandle = null;
          return;
        }

        handleRef.current = museumHandle;
        resetScrollInstant();

        window.addEventListener("scroll", updateScrollTarget, { passive: true });
        window.addEventListener("resize", handleResize);
        window.addEventListener("pointermove", handlePointerMove, {
          passive: true,
        });
        listenersAttached = true;
        updateScrollTarget();

        let lastTime = performance.now();
        const startTime = lastTime;
        let loggedStats = false;

        const animate = (now: number) => {
          if (enteredRef.current || abortController.signal.aborted) return;
          const dt = Math.min(0.05, (now - lastTime) / 1000);
          lastTime = now;

          const diff = targetProgressRef.current - smoothProgressRef.current;
          smoothProgressRef.current += diff * Math.min(1, dt * 8.5);

          museumHandle?.update(
            smoothProgressRef.current,
            pointerRef.current.x,
            pointerRef.current.y,
            (now - startTime) / 1000,
          );

          if (!loggedStats && museumHandle) {
            loggedStats = true;
            const stats: MuseumRenderStats = museumHandle.getStats();
            (
              window as unknown as { __COGITO_3D_STATS__?: MuseumRenderStats }
            ).__COGITO_3D_STATS__ = stats;
          }

          rafId = window.requestAnimationFrame(animate);
        };

        rafId = window.requestAnimationFrame(animate);

        revealHoldTimer = window.setTimeout(() => {
          revealHoldTimer = null;
          setLoaderFadingOut(true);
          revealUnmountTimer = window.setTimeout(() => {
            revealUnmountTimer = null;
            setLoaderVisible(false);
          }, 500);
        }, 180);
      } catch (err) {
        if (
          abortController.signal.aborted ||
          err instanceof MuseumBuildAbortedError
        ) {
          return;
        }
        setLoaderVisible(false);
        setWebglUnsupported(true);
      }
    };

    void initMuseum();

    return () => {
      abortController.abort();
      window.cancelAnimationFrame(rafId);
      if (revealHoldTimer !== null) {
        window.clearTimeout(revealHoldTimer);
        revealHoldTimer = null;
      }
      if (revealUnmountTimer !== null) {
        window.clearTimeout(revealUnmountTimer);
        revealUnmountTimer = null;
      }
      if (enterTimeoutRef.current !== null) {
        window.clearTimeout(enterTimeoutRef.current);
        enterTimeoutRef.current = null;
      }
      document.body.style.overflow = "";
      if (listenersAttached) {
        window.removeEventListener("scroll", updateScrollTarget);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("pointermove", handlePointerMove);
      }
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      museumHandle?.dispose();
      handleRef.current = null;
    };
  }, [completeEntry]);

  if (webglUnsupported) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-panna px-6 py-16 text-center">
        <h1 className="font-serif text-6xl font-bold tracking-[0.14em] text-gold-deep sm:text-8xl">
          COGITO
        </h1>
        <p className="mt-5 max-w-xl text-xl text-ink-secondary">
          Benvenuto nel museo digitale. Scopri le opere, gli archivi storici e i
          luoghi della cultura intorno a te.
        </p>
        <button
          type="button"
          onClick={completeEntry}
          className="btn-museum-primary mt-8"
        >
          <span>Entra nel Museo</span>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </section>
    );
  }

  const clampedProgress = Math.min(100, Math.max(0, Math.round(loadProgress)));

  return (
    <div
      ref={trackRef}
      aria-label="Ingresso 3D nel Museo Cogito"
      className="relative h-[300vh] bg-gradient-to-b from-[#ECE2CF] via-[#F7F0E3] to-panna"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Background COGITO title raised cleanly in the upper sky so every letter (C-O-G-I-T-O) is clearly legible */}
        <div
          aria-hidden="true"
          style={{ opacity: Math.max(0.1, 1 - fadeOpacity * 1.1) }}
          className="pointer-events-none absolute inset-x-0 top-[1.2%] z-0 flex select-none justify-center px-4 sm:top-[1%]"
        >
          <span className="font-serif text-[16vw] font-semibold uppercase leading-[0.88] tracking-[0.15em] text-gold-deep/55 sm:text-[12vw] lg:text-[10.5vw]">
            COGITO
          </span>
        </div>

        {/* 3D Photorealistic Neoclassical Museum Canvas */}
        <canvas
          ref={canvasRef}
          className="relative z-10 block h-full w-full"
          aria-hidden="true"
        />

        {/* Subtle photographic optical vignette */}
        <div
          aria-hidden="true"
          className="museum-3d-vignette pointer-events-none absolute inset-0 z-10"
        />

        {/* Scroll guidance & accessible direct-entry button */}
        <div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex flex-col items-center gap-3.5 px-4 transition-opacity duration-200"
        >
          <div className="flex items-center gap-2 text-base font-medium tracking-wide text-ink-secondary sm:text-lg">
            <ChevronDown
              className="h-5 w-5 animate-bounce text-gold-deep"
              aria-hidden="true"
            />
            <span>Scorri verso il basso per entrare</span>
          </div>

          <button
            type="button"
            disabled={hintOpacity <= 0.05}
            tabIndex={hintOpacity <= 0.05 ? -1 : 0}
            onClick={completeEntry}
            className={`${
              hintOpacity <= 0.05 ? "pointer-events-none" : "pointer-events-auto"
            } btn-museum-secondary bg-panna/85 backdrop-blur-sm`}
          >
            <span>Entra subito</span>
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Warm panna fade overlay as the entrance book opens into the 2D Main Page */}
        <div
          aria-hidden="true"
          style={{ opacity: fadeOpacity }}
          className="pointer-events-none fixed inset-0 z-30 bg-panna transition-opacity duration-150"
        />
      </div>

      {/* Progressive museum 3D loading screen overlay */}
      {loaderVisible && (
        <div
          aria-busy={!loaderFadingOut}
          className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-b from-[#ECE2CF] via-[#F7F0E3] to-panna px-6 transition-opacity duration-500 ease-out ${
            loaderFadingOut ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex w-full max-w-md flex-col items-center text-center">
            <div className="mb-5 h-px w-16 bg-gold-deep/45" aria-hidden="true" />

            <h1 className="font-serif text-5xl font-semibold uppercase tracking-[0.22em] text-gold-deep sm:text-6xl">
              COGITO
            </h1>
            <p className="mt-2 font-serif text-lg italic tracking-wide text-ink-secondary sm:text-xl">
              Il Museo oltre i Confini
            </p>

            <div className="mt-9 w-full space-y-3">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={clampedProgress}
                aria-label="Caricamento del museo 3D Cogito"
                className="h-2.5 w-full overflow-hidden rounded-full border border-gold-light/80 bg-panna-deep/80 p-0.5 shadow-inner"
              >
                <div
                  style={{ width: `${clampedProgress}%` }}
                  className="museum-load-shimmer h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-[#C8A458] transition-[width] duration-300 ease-out"
                />
              </div>

              <div className="flex items-center justify-between gap-4 text-sm font-medium text-ink-secondary">
                <span aria-live="polite">{loadLabel}</span>
                <span className="tabular-nums font-semibold text-gold-deep">
                  {clampedProgress}%
                </span>
              </div>
            </div>

            <div className="mt-6 h-px w-16 bg-gold-deep/30" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
}
