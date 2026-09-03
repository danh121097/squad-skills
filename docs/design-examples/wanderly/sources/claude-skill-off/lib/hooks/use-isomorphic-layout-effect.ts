"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * Animations set their "before" state here, ahead of paint, so a reveal
 * never flashes its finished state first.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
