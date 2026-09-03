"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

type TextRevealProps = {
  lines: string[];
  as?: "div" | "h1" | "h2" | "h3";
  id?: string;
  className?: string;
  lineClassName?: string;
  mode?: "line" | "word";
  triggerOnLoad?: boolean;
  stagger?: number;
};

export function TextReveal({
  lines,
  as: Component = "div",
  id,
  className,
  lineClassName,
  mode = "line",
  triggerOnLoad = false,
  stagger = 0.12,
}: TextRevealProps) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const targets = root.current?.querySelectorAll<HTMLElement>("[data-reveal-piece]");
      if (!targets?.length) return;
      gsap.fromTo(
        targets,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.15,
          ease: "power4.out",
          stagger,
          delay: triggerOnLoad ? 0.35 : 0,
          scrollTrigger: triggerOnLoad ? undefined : { trigger: root.current, start: "top 84%", once: true },
        },
      );
    }, root);

    return () => context.revert();
  }, [stagger, triggerOnLoad]);

  return (
    <Component ref={root} id={id} className={className} aria-label={lines.join(" ")}>
      {lines.map((line) => (
        <span key={line} className={`block overflow-hidden ${lineClassName ?? ""}`} aria-hidden="true">
          {mode === "word" ? (
            <span className="block">
              {line.split(" ").map((word, index) => (
                <span key={`${word}-${index}`} data-reveal-piece className="mr-[0.22em] inline-block">
                  {word}
                </span>
              ))}
            </span>
          ) : (
            <span data-reveal-piece className="block">{line}</span>
          )}
        </span>
      ))}
    </Component>
  );
}
