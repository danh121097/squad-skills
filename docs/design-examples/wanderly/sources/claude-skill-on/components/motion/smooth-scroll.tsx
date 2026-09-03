"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";

import { ScrollTrigger, gsap } from "@/lib/motion";

type ScrollLock = (locked: boolean) => void;

const ScrollLockContext = createContext<ScrollLock>(() => {});

/**
 * Lets an overlay (the mobile menu) freeze the page behind it. Kept as context
 * rather than a store: it is view state about one open panel, nothing more.
 */
export function useScrollLock(): ScrollLock {
  return useContext(ScrollLockContext);
}

/**
 * Smooth scrolling is an enhancement, not the transport layer.
 *
 * Lenis is only instantiated when the reader has not asked for reduced motion;
 * otherwise the browser's own scrolling is left completely alone — which also
 * preserves native find-in-page, spacebar/PageDown paging and screen-reader
 * caret movement for the readers most likely to be hurt by scroll hijacking.
 *
 * When it does run, Lenis drives ScrollTrigger from a single ticker so the two
 * never fight over the scroll position or run on separate rAF loops.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let lenis: Lenis | null = null;
    let detachScroll: (() => void) | undefined;

    const start = () => {
      if (lenis || prefersReducedMotion.matches) return;

      lenis = new Lenis({
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        // Touch keeps its native, momentum-correct scrolling.
        syncTouch: false,
        anchors: true,
        autoRaf: false,
      });

      lenisRef.current = lenis;
      detachScroll = lenis.on("scroll", ScrollTrigger.update);

      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    };

    const stop = () => {
      gsap.ticker.remove(tick);
      detachScroll?.();
      detachScroll = undefined;
      lenis?.destroy();
      lenis = null;
      lenisRef.current = null;
      ScrollTrigger.refresh();
    };

    function tick(time: number) {
      // gsap.ticker reports seconds; Lenis expects milliseconds.
      lenis?.raf(time * 1000);
    }

    const onPreferenceChange = () => {
      if (prefersReducedMotion.matches) stop();
      else start();
    };

    start();
    prefersReducedMotion.addEventListener("change", onPreferenceChange);

    return () => {
      prefersReducedMotion.removeEventListener("change", onPreferenceChange);
      stop();
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, []);

  const setScrollLock = useCallback<ScrollLock>((locked) => {
    const root = document.documentElement;

    if (locked) {
      lenisRef.current?.stop();
      // Covers the reduced-motion path, where no Lenis instance exists.
      root.style.overflow = "hidden";
    } else {
      lenisRef.current?.start();
      root.style.overflow = "";
    }
  }, []);

  return (
    <ScrollLockContext.Provider value={setScrollLock}>
      {children}
    </ScrollLockContext.Provider>
  );
}
