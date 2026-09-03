"use client";

import Image from "next/image";
import { useRef } from "react";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";

/**
 * Full-bleed opening frame. It arrives with a slow push-out from 1.08,
 * and on the way out it contracts into an editorial image block —
 * scale to 0.92, corners to 32px, margins appearing as it goes.
 */
export function HeroSection() {
  const section = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const sectionEl = section.current;
    const visualEl = visual.current;
    if (!sectionEl || !visualEl || reduced || motionIsReduced()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-hero-image]",
        { scale: 1.08 },
        { scale: 1, duration: 2, ease: "power2.out" },
      );

      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        gsap.to(visualEl, {
          scale: 0.92,
          borderRadius: 32,
          ease: "none",
          scrollTrigger: {
            trigger: sectionEl,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
          },
        });
        gsap.to(content.current, {
          opacity: 0,
          y: -32,
          ease: "none",
          scrollTrigger: {
            trigger: sectionEl,
            start: "top top",
            end: "55% top",
            scrub: 0.6,
          },
        });
      });

      return () => mm.revert();
    }, sectionEl);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={section} id="top" className="relative h-[100svh] md:h-[126svh]">
      <div className="sticky top-0 h-[100svh]">
        <div
          ref={visual}
          className="absolute inset-0 overflow-hidden will-change-transform"
        >
          <Image
            data-hero-image
            src="/assets/hero-coastline.jpg"
            alt="A Mediterranean coastline falling away beneath a headland at first light"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover will-change-transform"
          />
          {/* Light-handed grading: enough to seat the type, not enough to dull the photograph. */}
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-forest/72 via-forest/26 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-forest/35 to-transparent" />
        </div>

        <div
          ref={content}
          className="wrap relative flex h-full flex-col justify-end pb-14 text-canvas md:pb-20"
        >
          <Reveal trigger="load" delay={0.3} distance={18} duration={0.9}>
            <p className="eyebrow text-canvas/75">Curated journeys around the world</p>
          </Reveal>

          <TextReveal
            as="h1"
            trigger="load"
            delay={0.4}
            stagger={0.11}
            duration={1.25}
            lines={["Go somewhere", "you'll remember."]}
            className="display mt-6 text-[clamp(48px,13vw,140px)] leading-[0.92] md:mt-8 md:text-[clamp(72px,8vw,140px)]"
          />

          <div className="mt-9 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between md:gap-16">
            <Reveal trigger="load" delay={0.85} distance={20} duration={0.9}>
              <p className="max-w-[42ch] text-[16px] leading-[1.6] text-canvas/78 md:text-[18px]">
                Thoughtfully curated journeys, extraordinary places, and stories worth
                bringing home.
              </p>
            </Reveal>

            <Reveal
              trigger="load"
              delay={1.05}
              distance={20}
              duration={0.9}
              className="flex items-center gap-8"
            >
              <MagneticButton href="#journeys" variant="onImage" withArrow>
                Explore journeys
              </MagneticButton>
              <span className="eyebrow hidden items-center gap-3 text-canvas/55 lg:flex">
                Scroll
                <span aria-hidden="true" className="block h-px w-14 bg-canvas/35" />
              </span>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
