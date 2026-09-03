"use client";

import { ArrowDownRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!section.current || !frame.current || !image.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
      timeline
        .fromTo(image.current, { scale: 1.08 }, { scale: 1, duration: 1.2 })
        .fromTo("[data-hero-line]", { yPercent: 115 }, { yPercent: 0, duration: 0.8, stagger: 0.08 }, 0.22)
        .fromTo("[data-hero-copy]", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.08 }, 0.46);
      gsap.to(frame.current, {
        scale: 0.94,
        borderRadius: 32,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: 1 },
      });
      gsap.to(image.current, {
        scale: 0.92,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: 1 },
      });
    }, section);
    return () => context.revert();
  }, []);

  return (
    <section ref={section} id="hero" className="hero-shell" aria-labelledby="hero-title">
      <div ref={frame} className="hero-frame">
        <Image ref={image} src="/assets/hero-coastline.jpg" alt="A sunlit Mediterranean coastline descending into blue water" fill priority sizes="100vw" className="hero-image" />
        <div className="hero-wash" />
        <div className="hero-content">
          <p data-hero-copy className="eyebrow eyebrow--light">Curated journeys around the world</p>
          <h1 id="hero-title">
            <span className="hero-line"><span data-hero-line>Go somewhere</span></span>
            <span className="hero-line"><span data-hero-line>you&apos;ll remember.</span></span>
          </h1>
          <div data-hero-copy className="hero-bottom">
            <p>Thoughtfully curated journeys, extraordinary places, and stories worth bringing home.</p>
            <a href="#destinations" className="hero-link">Explore journeys <ArrowDownRight aria-hidden="true" size={20} strokeWidth={1.5} /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
