import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  immediate?: boolean;
}

export function RevealOnScroll({
  children,
  className = "",
  delayMs = 0,
  immediate = false,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (immediate) {
      let rafId = 0;
      const timer = window.setTimeout(() => {
        rafId = window.requestAnimationFrame(() => {
          setVisible(true);
        });
      }, 75);
      return () => {
        window.clearTimeout(timer);
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }

    const el = ref.current;
    if (!el) return;

    const checkVisibility = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (rect.top <= vh * 0.9) {
        setVisible(true);
      } else if (rect.top > vh + 80) {
        // Re-arm cleanly if scrolled back above so section glides in smoothly again
        setVisible(false);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
          } else if (entry.boundingClientRect.top > (window.innerHeight || 800) + 80) {
            setVisible(false);
          }
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    const armTimer = window.setTimeout(() => {
      observer.observe(el);
      checkVisibility();
    }, 120);

    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });

    return () => {
      window.clearTimeout(armTimer);
      observer.disconnect();
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
    };
  }, [immediate]);

  return (
    <div
      ref={ref}
      style={{
        transitionProperty: "opacity, transform",
        transitionDuration: "850ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${visible ? delayMs : 0}ms`,
      }}
      className={`will-change-[opacity,transform] ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-12 scale-[0.985] opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
