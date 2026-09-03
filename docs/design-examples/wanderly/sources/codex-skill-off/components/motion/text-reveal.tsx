"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createElement, useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

type TextRevealProps = {
  text: string | string[];
  mode?: "lines" | "words";
  as?: "div" | "p" | "h2" | "h3";
  className?: string;
  triggerStart?: string;
};

export function TextReveal({
  text,
  mode = "lines",
  as = "div",
  className = "",
  triggerStart = "top 80%",
}: TextRevealProps) {
  const root = useRef<HTMLElement>(null);
  const items = Array.isArray(text) ? text : mode === "words" ? text.split(" ") : [text];

  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = root.current.querySelectorAll<HTMLElement>("[data-reveal-inner]");
    const context = gsap.context(() => {
      gsap.fromTo(
        targets,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.8,
          stagger: Math.min(0.06, 0.45 / Math.max(items.length, 1)),
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: triggerStart, once: true },
        },
      );
    }, root);
    return () => context.revert();
  }, [items.length, triggerStart]);

  return createElement(
    as,
    { ref: root, className },
    items.map((item, index) => (
      <span className={mode === "words" ? "reveal-word" : "reveal-line"} key={`${item}-${index}`}>
        <span data-reveal-inner>{item}</span>
        {mode === "words" && index < items.length - 1 ? " " : null}
      </span>
    )),
  );
}
