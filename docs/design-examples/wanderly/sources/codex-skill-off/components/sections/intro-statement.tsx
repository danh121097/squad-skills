"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const lines = ["Travel isn't about", "seeing more places.", "It's about feeling", "something new."];

export function IntroStatement() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!section.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = section.current.querySelectorAll("span");
    const context = gsap.context(() => {
      gsap.fromTo(targets, { opacity: 0.18 }, { opacity: 1, stagger: 0.18, ease: "none", scrollTrigger: { trigger: section.current, start: "top 70%", end: "bottom 55%", scrub: 1 } });
    }, section);
    return () => context.revert();
  }, []);

  return (
    <section ref={section} className="intro-statement" aria-label="Wanderly travel philosophy">
      <p>{lines.map((line) => <span key={line}>{line}</span>)}</p>
    </section>
  );
}
