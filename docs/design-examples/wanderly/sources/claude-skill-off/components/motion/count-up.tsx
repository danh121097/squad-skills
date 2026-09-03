"use client";

import { useRef } from "react";

import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";

type CountUpProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
};

/**
 * Counts to the figure the first time it is seen. The final value is what
 * renders on the server, so the number is correct before — and without —
 * any animation.
 */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 2,
  className,
}: CountUpProps) {
  const el = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const settled = `${value.toFixed(decimals)}${suffix}`;

  useIsomorphicLayoutEffect(() => {
    const node = el.current;
    if (!node || reduced || motionIsReduced()) return;

    const ctx = gsap.context(() => {
      const counter = { current: 0 };
      gsap.to(counter, {
        current: value,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: node, start: "top 88%", once: true },
        onStart: () => {
          node.textContent = `${(0).toFixed(decimals)}${suffix}`;
        },
        onUpdate: () => {
          node.textContent = `${counter.current.toFixed(decimals)}${suffix}`;
        },
      });
    }, node);

    return () => {
      ctx.revert();
      node.textContent = settled;
    };
  }, [reduced, value, decimals, suffix, duration, settled]);

  return (
    <span ref={el} className={className}>
      {settled}
    </span>
  );
}
