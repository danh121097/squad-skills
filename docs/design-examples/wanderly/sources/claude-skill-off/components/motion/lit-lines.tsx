"use client";

import { useRef, useState, type ElementType } from "react";

import { cx } from "@/lib/cx";
import { ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";

type LitLinesProps = {
  lines: readonly string[];
  as?: ElementType;
  /**
   * `active` keeps a single line lit as it passes the middle of the screen;
   * `cumulative` lights each line and leaves it lit.
   */
  mode?: "active" | "cumulative";
  className?: string;
  lineClassName?: string;
};

/**
 * Statement typography that reads itself as you scroll. Dimmed lines sit
 * at 0.2; the live one comes to full. Under reduced motion every line is
 * simply at full opacity from the start.
 */
export function LitLines({
  lines,
  as: Tag = "p",
  mode = "active",
  className,
  lineClassName,
}: LitLinesProps) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [lit, setLit] = useState<readonly boolean[]>(() => lines.map(() => false));
  /** Dimming only ever happens once the scroll logic is live, so the
   *  server-rendered page — and any page without JS — reads at full. */
  const [armed, setArmed] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || reduced || motionIsReduced()) return;
    setArmed(true);

    const nodes = Array.from(
      el.querySelectorAll<HTMLElement>("[data-lit-line]"),
    );

    const setAt = (index: number, value: boolean) =>
      setLit((current) => {
        if (current[index] === value) return current;
        const next = [...current];
        next[index] = value;
        return next;
      });

    const triggers = nodes.map((node, index) =>
      mode === "cumulative"
        ? ScrollTrigger.create({
            trigger: node,
            start: "top 82%",
            once: true,
            onEnter: () => setAt(index, true),
          })
        : ScrollTrigger.create({
            trigger: node,
            start: "top 62%",
            end: "bottom 38%",
            onToggle: (self) => setAt(index, self.isActive),
          }),
    );

    return () => {
      triggers.forEach((trigger) => trigger.kill());
      setArmed(false);
    };
  }, [reduced, mode, lines]);

  return (
    <Tag ref={root} className={className}>
      {lines.map((line, index) => (
        <span
          key={`${line}-${index}`}
          data-lit-line
          className={cx(
            "block transition-opacity duration-[900ms] ease-editorial",
            armed && !lit[index] ? "opacity-20" : "opacity-100",
            lineClassName,
          )}
        >
          {line}
        </span>
      ))}
    </Tag>
  );
}
