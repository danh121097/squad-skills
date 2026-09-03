"use client";

import { useRef, type ElementType } from "react";

import { DURATION, EASE, MOTION_OK, STAGGER, gsap, useGSAP } from "@/lib/motion";

type TextRevealProps = {
  /** One entry per typeset line. Where a line breaks is an editorial decision,
   *  so it is authored here rather than left for the browser to discover. */
  lines: readonly string[];
  /** `line` masks whole lines; `word` masks each word for finer choreography. */
  mode?: "line" | "word";
  as?: ElementType;
  /** Present so a heading rendered through this component can still be the
   *  target of its section's aria-labelledby. */
  id?: string;
  className?: string;
  /** A string styles every line; an array styles them positionally, which lets
   *  one line differ — an italic turn in a sentence, an indent — without the
   *  caller hand-rolling a second reveal. Deliberately serializable: a callback
   *  here would stop server components from rendering this component at all. */
  lineClassName?: string | readonly string[];
  /** `load` fires immediately (hero); `scroll` waits for the block to arrive. */
  trigger?: "load" | "scroll";
  delay?: number;
  stagger?: number;
  duration?: number;
  start?: string;
};

/**
 * Masked vertical typography reveal: each line sits in an `overflow: hidden`
 * box and rises from translateY(110%) to 0.
 *
 * Decisions worth keeping:
 * - the mask is a plain <span>, so the heading's text content and reading order
 *   are untouched for assistive technology;
 * - word mode keeps the inter-word space inside the mask, so screen-reader
 *   output and copy/paste still contain real spaces rather than run-on words;
 * - the mask carries `pb-[0.18em] -mb-[0.18em]` because `overflow: hidden`
 *   otherwise shears the descenders off g, y and p at display sizes;
 * - nothing is hidden by default. The resting state is fully visible and the
 *   offset is only introduced once motion is confirmed (see globals.css and the
 *   boot script in app/layout.tsx).
 */
export function TextReveal({
  lines,
  mode = "line",
  as: Tag = "span",
  id,
  className,
  lineClassName,
  trigger = "scroll",
  delay = 0,
  stagger,
  duration = DURATION.slow,
  start = "top 85%",
}: TextRevealProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const targets = gsap.utils.toArray<HTMLElement>(
          "[data-reveal-mask] > span",
          root.current,
        );
        if (targets.length === 0) return;

        // `y: 0` is load-bearing. GSAP reads the element's computed transform
        // first, so the pre-paint `translateY(110%)` from globals.css arrives
        // as a *pixel* y — and `yPercent` would then stack on top of it,
        // leaving the line one full line-height low once the tween finished.
        // Zeroing y hands both components of the translation to GSAP.
        gsap.set(targets, { y: 0, yPercent: 110 });

        gsap.to(targets, {
          yPercent: 0,
          duration,
          delay,
          ease: EASE,
          stagger: stagger ?? (mode === "word" ? STAGGER.word : STAGGER.line),
          scrollTrigger:
            trigger === "scroll"
              ? { trigger: root.current, start, once: true }
              : undefined,
        });
      });

      return () => media.revert();
    },
    { scope: root },
  );

  const lineClass = (index: number) =>
    (typeof lineClassName === "string"
      ? lineClassName
      : lineClassName?.[index]) ?? "";

  return (
    <Tag ref={root} id={id} className={className}>
      {lines.map((line, lineIndex) =>
        mode === "line" ? (
          <span
            key={`${line}-${lineIndex}`}
            data-reveal-mask=""
            className={`block -mb-[0.18em] overflow-hidden ${lineClass(lineIndex)}`}
          >
            <span className="block pb-[0.18em] will-change-transform">
              {line}
            </span>
          </span>
        ) : (
          <span
            key={`${line}-${lineIndex}`}
            className={`block ${lineClass(lineIndex)}`}
          >
            {line.split(" ").map((word, wordIndex, words) => (
              <span
                key={`${word}-${wordIndex}`}
                data-reveal-mask=""
                className="inline-block -mb-[0.18em] overflow-hidden align-bottom"
              >
                <span className="inline-block pb-[0.18em] will-change-transform">
                  {word}
                  {wordIndex < words.length - 1 ? "\u00A0" : ""}
                </span>
              </span>
            ))}
          </span>
        ),
      )}
    </Tag>
  );
}
