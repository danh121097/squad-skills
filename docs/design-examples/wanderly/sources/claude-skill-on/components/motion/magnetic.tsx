"use client";

import { useRef, type ReactNode } from "react";

import { DURATION, EASE, FINE_POINTER, gsap, useGSAP } from "@/lib/motion";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** Maximum travel in px. The brief's range is 4–8; 6 is the default. */
  strength?: number;
  /** Inner content drifts slightly further than the frame for a little depth. */
  contentStrength?: number;
};

/**
 * Wraps an interactive element so it leans a few pixels toward the pointer.
 *
 * Registered under `(hover: hover) and (pointer: fine) and
 * (prefers-reduced-motion: no-preference)`, so it is capability-gated rather
 * than device-gated: a touch laptop with a trackpad gets it, a tablet does not,
 * and anyone who has asked for less motion gets a completely static button.
 * When the query stops matching, matchMedia.revert() removes the transform, so
 * the control can never be left stranded off-centre.
 *
 * The effect is decorative only — it moves the element, never the hit area's
 * relationship to its label, and the wrapped control keeps its own focus ring.
 */
export function Magnetic({
  children,
  className,
  strength = 6,
  contentStrength = 3,
}: MagneticProps) {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(FINE_POINTER, () => {
        const el = root.current;
        const content = el?.firstElementChild;
        if (!el || !content) return;

        const moveX = gsap.quickTo(el, "x", {
          duration: DURATION.fast,
          ease: EASE,
        });
        const moveY = gsap.quickTo(el, "y", {
          duration: DURATION.fast,
          ease: EASE,
        });
        const contentX = gsap.quickTo(content, "x", {
          duration: DURATION.base,
          ease: EASE,
        });
        const contentY = gsap.quickTo(content, "y", {
          duration: DURATION.base,
          ease: EASE,
        });

        const onMove = (event: PointerEvent) => {
          const bounds = el.getBoundingClientRect();
          // Normalised to -1..1 from the centre, then damped to `strength`.
          const relX = (event.clientX - bounds.left) / bounds.width - 0.5;
          const relY = (event.clientY - bounds.top) / bounds.height - 0.5;

          moveX(relX * strength * 2);
          moveY(relY * strength * 2);
          contentX(relX * contentStrength * 2);
          contentY(relY * contentStrength * 2);
        };

        const onLeave = () => {
          moveX(0);
          moveY(0);
          contentX(0);
          contentY(0);
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        el.addEventListener("blur", onLeave, true);

        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
          el.removeEventListener("blur", onLeave, true);
        };
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <span ref={root} className={`inline-block ${className ?? ""}`}>
      {children}
    </span>
  );
}
