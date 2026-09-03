"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

/**
 * The brief's curve, exactly: cubic-bezier(0.22, 1, 0.36, 1) expressed as the
 * cubic path CustomEase understands. Registering it once means CSS transitions
 * (--ease-editorial) and GSAP tweens share a single motion character instead of
 * drifting apart into two different "premium" feels.
 */
if (typeof window !== "undefined" && !CustomEase.get("editorial")) {
  CustomEase.create("editorial", "M0,0 C0.22,1 0.36,1 1,1");
}

export { gsap, ScrollTrigger, useGSAP };

export const EASE = "editorial";

/** Slow, Apple-ish. Nothing on this page is allowed to feel snappy. */
export const DURATION = {
  fast: 0.6,
  base: 0.9,
  slow: 1.2,
  cinematic: 1.6,
} as const;

export const STAGGER = {
  line: 0.1,
  word: 0.045,
  group: 0.12,
} as const;

/**
 * Media queries used with gsap.matchMedia(). Every scroll-linked or expressive
 * behaviour is registered inside one of these, so `matchMedia.revert()` removes
 * the animation *and* the inline styles it set when the query stops matching —
 * which is what makes the reduced-motion path a real fallback rather than a
 * faster animation.
 */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const MOTION_OK_DESKTOP =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
export const FINE_POINTER =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
