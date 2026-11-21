import { ArrowRight, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildNeoclassicalMuseum,
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

  const [webglUnsupported, setWebglUnsupported] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [hintOpacity, setHintOpacity] = useState(1);

  const completeEntry = useCallback(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    setFadeOpacity(1);

    window.setTimeout(() => {
      handleRef.current?.dispose();
      handleRef.current = null;
      window.scrollTo({ top: 0, behavior: "auto" });
      onEnter();
    }, 340);
  }, [onEnter]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let museumHandle: NeoclassicalMuseumHandle | null = null;
    try {
      museumHandle = buildNeoclassicalMuseum(canvas);
      handleRef.current = museumHandle;
    } catch {
      setWebglUnsupported(true);
      return;
    }

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

    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    updateScrollTarget();

    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;
    let loggedStats = false;

    const animate = (now: number) => {
      if (enteredRef.current) return;
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
        (window as unknown as { __COGITO_3D_STATS__?: MuseumRenderStats }).__COGITO_3D_STATS__ =
          stats;
      }

      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", updateScrollTarget);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
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
            onClick={completeEntry}
            className="pointer-events-auto btn-museum-secondary bg-panna/85 backdrop-blur-sm"
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
    </div>
  );
}
