"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 42, suffix: "", label: "Countries" },
  { value: 128, suffix: "", label: "Curated journeys" },
  { value: 18, suffix: "K+", label: "Travelers" },
  { value: 49, suffix: "", label: "Average rating", decimal: true },
] as const;

function CountUp({ value, suffix, decimal = false }: { value: number; suffix: string; decimal?: boolean }) {
  const [current, setCurrent] = useState(0);
  const node = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (reduced) {
        setCurrent(value);
        return;
      }
      const started = performance.now();
      const frame = (now: number) => {
        const progress = Math.min((now - started) / 1200, 1);
        setCurrent(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={node}>{decimal ? (current / 10).toFixed(1) : current}{suffix}</span>;
}

export function Numbers() {
  return (
    <section className="numbers section-shell" aria-label="Wanderly in numbers">
      {stats.map((stat) => (
        <div className="stat-row" key={stat.label}>
          <CountUp value={stat.value} suffix={stat.suffix} decimal={"decimal" in stat ? stat.decimal : false} />
          <p>{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
