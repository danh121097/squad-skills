"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const lines = ["The best trips", "aren't measured", "in miles."];

export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo("span", { opacity: 0.16 }, { opacity: 1, stagger: 0.25, ease: "none", scrollTrigger: { trigger: root.current, start: "top 65%", end: "bottom 55%", scrub: 1 } });
    }, root);
    return () => context.revert();
  }, []);

  return (
    <section ref={root} className="manifesto" aria-label="Wanderly manifesto">
      <p>{lines.map((line) => <span key={line}>{line}</span>)}</p>
    </section>
  );
}
