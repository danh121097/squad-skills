"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

const lines = ["The best trips", "aren’t measured", "in miles."];

export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo("[data-manifesto-line]", { opacity: 0.15 }, {
        opacity: 1,
        stagger: 0.2,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 42%", scrub: 0.6 },
      });
    }, root);
    return () => context.revert();
  }, []);

  return (
    <section ref={root} className="page-shell flex min-h-screen items-center justify-center py-24 text-center" aria-labelledby="manifesto-heading">
      <h2 id="manifesto-heading" className="font-editorial text-[clamp(4.2rem,9vw,9rem)] leading-[0.87] tracking-[-0.055em]">
        {lines.map((line) => <span key={line} data-manifesto-line className="block opacity-15">{line}</span>)}
      </h2>
    </section>
  );
}
