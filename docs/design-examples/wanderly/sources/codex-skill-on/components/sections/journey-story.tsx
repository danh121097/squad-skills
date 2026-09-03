"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { chapters } from "@/lib/content/travel-content";

export function JourneyStory() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    if (!section.current || window.matchMedia("(max-width: 767px)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((chapter, index) => {
        ScrollTrigger.create({
          trigger: chapter,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && setActive(index),
        });
      });
    }, section);
    return () => context.revert();
  }, []);

  return (
    <section ref={section} className="bg-[var(--surface-raised)] py-24 md:py-0" aria-labelledby="story-heading">
      <div className="page-shell md:grid md:grid-cols-2 md:gap-20">
        <div className="mb-16 md:sticky md:top-0 md:mb-0 md:flex md:h-screen md:items-center">
          <div className="w-full">
            <p className="eyebrow mb-5 text-[var(--accent)]">A journey, slowly told</p>
            <h2 id="story-heading" className="sr-only">The Bali journey, chapter by chapter</h2>
            <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[var(--radius-image)] bg-black md:block">
              {chapters.map((chapter, index) => (
                <Image key={chapter.number} src={chapter.image} alt={chapter.alt} fill sizes="50vw" className={`object-cover transition-[opacity,transform,filter] duration-[1200ms] ease-[var(--ease-out)] ${active === index ? "scale-100 opacity-100 blur-0" : "scale-[1.04] opacity-0 blur-sm"}`} />
              ))}
              <span className="absolute bottom-5 right-5 text-xs font-bold tracking-[0.14em] text-white/75">{chapters[active].number} / 04</span>
            </div>
          </div>
        </div>

        <div>
          {chapters.map((chapter) => (
            <article key={chapter.number} data-chapter className="flex min-h-[72svh] flex-col justify-center border-b border-black/12 py-20 last:border-0 md:min-h-screen">
              <div className="relative mb-8 aspect-[4/5] overflow-hidden rounded-[var(--radius-image)] md:hidden">
                <Image src={chapter.image} alt={chapter.alt} fill sizes="100vw" className="object-cover" />
              </div>
              <span className="font-editorial mb-6 text-7xl text-[var(--warm)]">{chapter.number}</span>
              <h3 className="font-editorial max-w-xl text-[clamp(3.2rem,6vw,6.8rem)] leading-[0.9] tracking-[-0.045em]">{chapter.title}</h3>
              <p className="mt-7 max-w-md text-base leading-7 text-[var(--text-muted)]">{chapter.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
