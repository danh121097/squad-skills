"use client";

import { useEffect } from "react";
import Lenis from "lenis";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";

let instance: Lenis | null = null;

/** Lets the mobile menu freeze the page without fighting the smoother. */
export function lockScroll(locked: boolean): void {
  if (instance) {
    if (locked) instance.stop();
    else instance.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

/**
 * Lenis, driven off the GSAP ticker so smoothing and ScrollTrigger share
 * one clock. Switched off entirely under reduced motion — native
 * scrolling is the honest fallback.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || motionIsReduced()) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    instance = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      instance = null;
    };
  }, [reduced]);

  /**
   * Trigger positions are measured at creation, which is before the
   * editorial serif has swapped in and before the photography has laid
   * out. Without a recount, every `once` reveal further down the page is
   * armed against stale coordinates.
   */
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();

    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh).catch(() => {});
    const settle = window.setTimeout(refresh, 600);

    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(settle);
    };
  }, []);

  return null;
}
