"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { experiences } from "@/lib/content/travel-content";

function ExperiencePanel({ item }: { item: (typeof experiences)[number] }) {
  return (
    <article className="group relative h-[72svh] w-[84vw] shrink-0 overflow-hidden bg-black md:h-screen md:w-[68vw]">
      <Image src={item.image} alt={item.alt} fill sizes="(max-width: 767px) 84vw, 68vw" className="object-cover opacity-80 transition-transform duration-[1400ms] ease-[var(--ease-out)] group-hover:scale-[1.035]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 md:p-10">
        <div>
          <span className="eyebrow mb-3 block text-white/60">{item.number}</span>
          <h3 className="font-editorial text-[clamp(4rem,7vw,7rem)] leading-none tracking-[-0.04em]">{item.name}</h3>
        </div>
        <p className="max-w-[15rem] text-right text-sm leading-6 text-white/70 md:text-base">{item.copy}</p>
      </div>
    </article>
  );
}

export function HorizontalExperiences() {
  const desktop = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!desktop.current || !track.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(min-width: 768px)", () => {
      const distance = () => Math.max(0, (track.current?.scrollWidth ?? 0) - window.innerWidth);
      gsap.to(track.current, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: desktop.current,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.65,
          pin: true,
          invalidateOnRefresh: true,
        },
      });
    });
    return () => media.revert();
  }, []);

  return (
    <section id="journeys" className="bg-[var(--night)] text-[var(--surface)]" aria-labelledby="experiences-heading">
      <div className="px-[var(--page-pad)] pb-10 pt-28 md:hidden">
        <p className="eyebrow mb-4 text-white/55">Find your rhythm</p>
        <h2 id="experiences-heading" className="font-editorial text-[clamp(3.7rem,16vw,5rem)] leading-[0.9] tracking-[-0.04em]">Choose your kind<br />of escape.</h2>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--page-pad)] pb-28 md:hidden">
        {experiences.map((item) => <div key={item.name} className="snap-center"><ExperiencePanel item={item} /></div>)}
      </div>

      <section ref={desktop} className="relative hidden h-screen overflow-hidden md:block">
        <div ref={track} className="flex h-full w-max items-stretch">
          <header className="flex h-full w-[48vw] shrink-0 flex-col justify-between px-[var(--page-pad)] py-20">
            <p className="eyebrow text-white/55">Find your rhythm</p>
            <h2 className="font-editorial text-[clamp(4.8rem,7vw,8rem)] leading-[0.86] tracking-[-0.05em]">Choose<br />your kind<br />of escape.</h2>
            <p className="max-w-xs text-sm leading-6 text-white/55">Four ways to step out of the familiar. No rigid itineraries—just a place to begin.</p>
          </header>
          {experiences.map((item) => <ExperiencePanel key={item.name} item={item} />)}
          <div className="w-[8vw] shrink-0" />
        </div>
      </section>
    </section>
  );
}
