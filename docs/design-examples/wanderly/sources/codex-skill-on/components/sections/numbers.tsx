"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

const stats = [
  { value: 42, suffix: "", label: "Countries" },
  { value: 128, suffix: "", label: "Curated journeys" },
  { value: 18, suffix: "K+", label: "Travelers" },
  { value: 4.9, suffix: "", label: "Average rating", decimals: 1 },
];

export function Numbers() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-stat]").forEach((element, index) => {
        const stat = stats[index];
        const counter = { value: 0 };
        gsap.to(counter, {
          value: stat.value,
          duration: 1.8,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 86%", once: true },
          onUpdate: () => {
            element.textContent = `${counter.value.toFixed(stat.decimals ?? 0)}${stat.suffix}`;
          },
        });
      });
    }, root);
    return () => context.revert();
  }, []);

  return (
    <section ref={root} className="page-shell pb-[var(--section-space)]" aria-labelledby="numbers-heading">
      <h2 id="numbers-heading" className="sr-only">Wanderly by the numbers</h2>
      <div className="border-t border-black/15">
        {stats.map((stat) => (
          <div key={stat.label} className="grid items-baseline gap-4 border-b border-black/15 py-6 md:grid-cols-[1fr_1fr] md:py-8">
            <strong data-stat className="font-editorial text-[clamp(5rem,10vw,8.5rem)] font-medium leading-none tracking-[-0.045em]">{stat.value}{stat.suffix}</strong>
            <span className="eyebrow text-[var(--text-muted)]">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
