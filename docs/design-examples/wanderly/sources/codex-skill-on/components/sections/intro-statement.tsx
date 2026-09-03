"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

const lines = ["Travel isn’t about", "seeing more places.", "It’s about feeling", "something new."];

export function IntroStatement() {
  const section = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!section.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-intro-line]");
      items.forEach((item, index) => {
        gsap.to(items, {
          opacity: (i) => (i === index ? 1 : 0.18),
          scrollTrigger: { trigger: item, start: "top 58%", end: "bottom 42%", scrub: 0.3 },
        });
      });
    }, section);
    return () => context.revert();
  }, []);

  return (
    <section ref={section} className="page-shell flex min-h-[125svh] items-center py-32" aria-labelledby="intro-heading">
      <h2 id="intro-heading" className="font-editorial w-full text-[clamp(3.6rem,8.2vw,8.5rem)] font-medium leading-[0.9] tracking-[-0.055em]">
        {lines.map((line) => <span key={line} data-intro-line className="block opacity-20">{line}</span>)}
      </h2>
    </section>
  );
}
