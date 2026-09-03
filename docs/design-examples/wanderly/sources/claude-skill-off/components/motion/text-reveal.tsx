"use client";

import { useRef, type ElementType } from "react";

import { cx } from "@/lib/cx";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";

type TextRevealProps = {
  /** One entry per visual line. Line breaks are a design decision here. */
  lines: readonly string[];
  as?: ElementType;
  /** Whole lines rise together, or each word carries its own delay. */
  split?: "line" | "word";
  /** Fire on page load (the hero) or when scrolled into view (everything else). */
  trigger?: "load" | "scroll";
  delay?: number;
  stagger?: number;
  duration?: number;
  start?: string;
  className?: string;
  lineClassName?: string;
};

/**
 * Masked vertical reveal. Each line sits in an `overflow: hidden` window
 * and its inner span travels from translateY(110%) to 0.
 *
 * Reduced motion: the effect never runs, so the markup renders in its
 * resting state — fully legible, nothing hidden behind a transform.
 */
export function TextReveal({
  lines,
  as: Tag = "div",
  split = "line",
  trigger = "scroll",
  delay = 0,
  stagger = 0.09,
  duration = 1.1,
  start = "top 85%",
  className,
  lineClassName,
}: TextRevealProps) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || reduced || motionIsReduced()) return;

    const items = gsap.utils.toArray<HTMLElement>("[data-reveal-item]", el);
    if (!items.length) return;

    const ctx = gsap.context(() => {
      gsap.set(items, { yPercent: 110 });
      gsap.to(items, {
        yPercent: 0,
        duration,
        delay: trigger === "load" ? delay : 0,
        stagger,
        ease: "power3.out",
        scrollTrigger:
          trigger === "scroll"
            ? { trigger: el, start, once: true }
            : undefined,
      });
    }, el);

    return () => {
      ctx.revert();
      // revert() restores the scope element dependably but not the nodes
      // matched inside it, so the resting state is asserted explicitly.
      gsap.set(items, { clearProps: "transform" });
    };
  }, [reduced, trigger, delay, stagger, duration, start, split, lines]);

  return (
    <Tag ref={root} className={className}>
      {lines.map((line, lineIndex) => (
        <span key={`${line}-${lineIndex}`} className={cx("reveal-line", lineClassName)}>
          {split === "word" ? (
            <WordLine line={line} />
          ) : (
            <span data-reveal-item className="block will-change-transform">
              {line}
            </span>
          )}
        </span>
      ))}
    </Tag>
  );
}

function WordLine({ line }: { line: string }) {
  const words = line.split(" ");

  return (
    <>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
            <span data-reveal-item className="inline-block will-change-transform">
              {word}
            </span>
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}
