"use client";

import { useRef, type ElementType, type ReactNode } from "react";

import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  /** Stagger direct children instead of moving the block as one. */
  stagger?: number;
  delay?: number;
  distance?: number;
  duration?: number;
  trigger?: "load" | "scroll";
  start?: string;
  className?: string;
};

/**
 * The quiet counterpart to TextReveal: a short rise and fade for
 * anything that isn't type — rules, meta rows, buttons, figures.
 */
export function Reveal({
  children,
  as: Tag = "div",
  stagger = 0,
  delay = 0,
  distance = 24,
  duration = 1,
  trigger = "scroll",
  start = "top 88%",
  className,
}: RevealProps) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || reduced || motionIsReduced()) return;

    const targets = stagger > 0 ? Array.from(el.children) : [el];

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: distance });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration,
        delay: trigger === "load" ? delay : 0,
        stagger,
        ease: "power3.out",
        scrollTrigger:
          trigger === "scroll" ? { trigger: el, start, once: true } : undefined,
      });
    }, el);

    return () => {
      ctx.revert();
      // Children are not restored by revert() the way the scope element
      // is; clear them by hand so nothing is stranded at opacity 0.
      gsap.set(targets, { clearProps: "opacity,transform" });
    };
  }, [reduced, stagger, delay, distance, duration, trigger, start]);

  return (
    <Tag ref={root} className={className}>
      {children}
    </Tag>
  );
}
