"use client";

import { useRef, useState } from "react";

import { DURATION, EASE, FINE_POINTER, gsap, useGSAP } from "@/lib/motion";

type CursorMode = "default" | "view" | "button";

/**
 * A small circular cursor that expands to read VIEW over photography and grows
 * slightly over controls.
 *
 * Constraints it respects:
 * - it only exists behind `(hover: hover) and (pointer: fine)` plus a motion
 *   preference check, so it never appears on touch or for reduced-motion users;
 * - the native cursor is only hidden while that query matches, and it is
 *   restored by matchMedia.revert() the moment it stops — a stuck invisible
 *   pointer is a serious failure, so hiding it is scoped to the same lifetime
 *   as the element that replaces it;
 * - `mix-blend-difference` keeps it legible over both the warm paper surface
 *   and full-bleed photography without a second colour token;
 * - it is aria-hidden and pointer-events-none: purely a decorative layer over
 *   an interface that already works without it.
 *
 * Targets opt in with `data-cursor="view"` or `data-cursor="button"`.
 */
export function EditorialCursor() {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CursorMode>("default");

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add(FINE_POINTER, () => {
      const el = root.current;
      if (!el) return;

      document.documentElement.style.cursor = "none";
      gsap.set(el, { opacity: 0, xPercent: -50, yPercent: -50 });

      const moveX = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
      const moveY = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });

      let revealed = false;

      const onMove = (event: PointerEvent) => {
        if (!revealed) {
          revealed = true;
          gsap.to(el, { opacity: 1, duration: DURATION.fast, ease: EASE });
        }
        moveX(event.clientX);
        moveY(event.clientY);
      };

      const onOver = (event: PointerEvent) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const hit = target.closest<HTMLElement>("[data-cursor]");
        const next = hit?.dataset.cursor;
        setMode(next === "view" || next === "button" ? next : "default");
      };

      const onLeaveWindow = () => {
        revealed = false;
        gsap.to(el, { opacity: 0, duration: 0.3, ease: EASE });
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerleave", onLeaveWindow);

      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointerleave", onLeaveWindow);
        document.documentElement.style.cursor = "";
        setMode("default");
      };
    });

    return () => media.revert();
  });

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[150] opacity-0 mix-blend-difference"
    >
      <span
        data-mode={mode}
        className="flex items-center justify-center rounded-full border border-white text-[10px] font-medium tracking-[0.14em] text-white uppercase transition-[width,height,background-color] duration-500 ease-editorial data-[mode=button]:h-11 data-[mode=button]:w-11 data-[mode=default]:h-3 data-[mode=default]:w-3 data-[mode=view]:h-20 data-[mode=view]:w-20 data-[mode=view]:bg-white/10"
      >
        <span
          className={
            mode === "view" ? "opacity-100 transition-opacity duration-300" : "opacity-0"
          }
        >
          View
        </span>
      </span>
    </div>
  );
}
