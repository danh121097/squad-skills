"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDownRight } from "lucide-react";
import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { TextReveal } from "@/components/motion/text-reveal";

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (!section.current || !frame.current || !image.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(image.current, { scale: 1.08 }, { scale: 1, duration: 1.6, ease: "power3.out" });
      gsap.fromTo("[data-hero-meta]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.14, delay: 0.9 });
      gsap.to(frame.current, {
        scale: 0.92,
        borderRadius: 32,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: 0.6 },
      });
    }, section);
    return () => context.revert();
  }, []);

  return (
    <section id="top" ref={section} className="relative h-[115svh]">
      <div ref={frame} className="sticky top-0 h-[100svh] overflow-hidden bg-[var(--night)] text-white will-change-transform">
        <div className="absolute inset-0">
          <Image ref={image} src="/assets/hero-coastline.jpg" alt="A cinematic coastline at golden hour" fill priority sizes="100vw" className="object-cover will-change-transform" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/10" />
        <div className="page-shell absolute inset-x-0 bottom-0 pb-9 md:pb-14">
          <p data-hero-meta className="eyebrow mb-5 text-white/80">Curated journeys around the world</p>
          <TextReveal as="h1" lines={["Go somewhere", "you’ll remember."]} triggerOnLoad className="font-editorial text-[clamp(4rem,8vw,8.75rem)] font-medium leading-[0.88] tracking-[-0.055em]" />
          <div className="mt-7 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <p data-hero-meta className="max-w-md text-sm leading-7 text-white/75 md:text-base">Thoughtfully curated journeys, extraordinary places, and stories worth bringing home.</p>
            <a data-hero-meta href="#journeys" className="link-arrow min-h-11 border-b border-white/50 pb-2 text-sm font-semibold">
              Explore journeys <ArrowDownRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
