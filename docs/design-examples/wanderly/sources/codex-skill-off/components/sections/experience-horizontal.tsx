"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { experiences } from "@/lib/content/travel-content";

gsap.registerPlugin(ScrollTrigger);

export function ExperienceHorizontal() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!section.current || !track.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const media = gsap.matchMedia();
    media.add("(min-width: 768px)", () => {
      const distance = () => Math.max(0, track.current!.scrollWidth - window.innerWidth);
      gsap.to(track.current, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", pin: true, scrub: 1, end: () => `+=${distance()}`, invalidateOnRefresh: true },
      });
    });
    return () => media.revert();
  }, []);

  return (
    <section ref={section} id="journeys" className="experiences" aria-labelledby="experiences-title">
      <div className="experience-heading">
        <p>Travel by instinct</p>
        <h2 id="experiences-title">Choose your kind<br />of escape.</h2>
      </div>
      <div ref={track} className="experience-track">
        {experiences.map((experience) => (
          <article key={experience.title} className="experience-panel" data-cursor="view">
            <Image src={experience.image} alt={`${experience.title} travel landscape`} fill sizes="(max-width: 767px) 88vw, 72vw" />
            <div className="experience-overlay" />
            <span>{experience.number}</span>
            <div><h3>{experience.title}</h3><p>{experience.description}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}
