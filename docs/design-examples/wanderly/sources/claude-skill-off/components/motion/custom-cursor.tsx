"use client";

import { useEffect, useRef, useState } from "react";

import { cx } from "@/lib/cx";
import { gsap } from "@/lib/gsap";
import { useFinePointer, useReducedMotion } from "@/lib/hooks/use-media-query";

type CursorMode = "default" | "view" | "button";

/**
 * A small circular cursor that grows into a VIEW disc over photography
 * and firms up slightly over controls. Mouse-only, and never rendered
 * for visitors who asked for reduced motion.
 */
export function CustomCursor() {
  const finePointer = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = finePointer && !reduced;

  const dot = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CursorMode>("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.dataset.cursorActive = "true";
    return () => {
      delete root.dataset.cursorActive;
    };
  }, [enabled]);

  useEffect(() => {
    const dotEl = dot.current;
    const discEl = disc.current;
    if (!enabled || !dotEl || !discEl) return;

    const dotX = gsap.quickTo(dotEl, "x", { duration: 0.12, ease: "power2.out" });
    const dotY = gsap.quickTo(dotEl, "y", { duration: 0.12, ease: "power2.out" });
    const discX = gsap.quickTo(discEl, "x", { duration: 0.55, ease: "power3.out" });
    const discY = gsap.quickTo(discEl, "y", { duration: 0.55, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      setVisible(true);
      dotX(event.clientX);
      dotY(event.clientY);
      discX(event.clientX);
      discY(event.clientY);

      const target = event.target as Element | null;
      const hit = target?.closest?.("[data-cursor]") as HTMLElement | null;
      const next = hit?.dataset.cursor;
      setMode(next === "view" ? "view" : next === "button" ? "button" : "default");
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[120]">
      <div
        ref={dot}
        className={cx(
          "absolute -left-[3px] -top-[3px] size-1.5 rounded-full bg-canvas mix-blend-difference",
          "transition-opacity duration-300 ease-editorial",
          visible && mode === "default" ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={disc}
        className={cx(
          "absolute -left-11 -top-11 flex size-22 items-center justify-center rounded-full",
          "transition-[transform,opacity,background-color] duration-[600ms] ease-editorial",
          mode === "view" && "bg-canvas/92 scale-100",
          mode === "button" && "scale-[0.34] border border-canvas mix-blend-difference",
          mode === "default" && "scale-0",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{ willChange: "transform" }}
      >
        <span
          className={cx(
            "eyebrow text-ink transition-opacity duration-300 ease-editorial",
            mode === "view" ? "opacity-100 delay-150" : "opacity-0",
          )}
        >
          View
        </span>
      </div>
    </div>
  );
}
