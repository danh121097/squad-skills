"use client";

import { useCallback, useSyncExternalStore } from "react";

const cache = new Map<string, MediaQueryList>();

function getList(query: string): MediaQueryList {
  let list = cache.get(query);
  if (!list) {
    list = window.matchMedia(query);
    cache.set(query, list);
  }
  return list;
}

/**
 * Media queries read through `useSyncExternalStore`, so the very first
 * client render already holds the right answer — no post-hydration flash
 * of an animation that should never have run.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = getList(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => getList(query).matches,
    () => false,
  );
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** True when the visitor has asked the OS for less movement. */
export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION);
}

/**
 * The synchronous read, for use inside layout effects.
 *
 * React runs the hydration pass against the server snapshot — `false` —
 * and layout effects fire on that same commit, before the corrected
 * value lands. Anything that hides content has to ask the platform
 * directly, or a reduced-motion visitor gets a page whose headlines were
 * translated out of sight and never brought back.
 */
export function motionIsReduced(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION).matches;
}

/** True for mouse-like input only — the gate for cursor and magnetism. */
export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** Desktop composition breakpoint. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}
