"use client";

import Image from "next/image";
import { useRef } from "react";

import { TextReveal } from "@/components/motion/text-reveal";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PillButton } from "@/components/ui/pill-button";
import { DURATION, EASE, MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { HERO } from "@/lib/content/site";

/**
 * The cover of the issue.
 *
 * Two separate motions, deliberately on two separate elements so they never
 * fight: the photograph settles from 1.08 on load, and the frame around it
 * scales to 0.92 with a 32px radius as you leave — the full-bleed cover
 * becoming a plate on a page. The frame is what carries the radius, so the
 * image never has to re-rasterise its own corners mid-scrub.
 *
 * The two gradients are the minimum needed to hold white type and the
 * transparent nav at AA over unknown photography; the picture is never dimmed
 * as a whole.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        gsap.from(photo.current, {
          scale: 1.08,
          duration: 1.8,
          ease: EASE,
        });

        // Eyebrow, then the supporting sentence, then — last — the CTA.
        // Roughly 1.5s of staggered arrival, ending on the one thing we want
        // the reader to act on.
        const rises = gsap.utils.toArray<HTMLElement>(
          "[data-reveal-rise]:not(.hero-cta)",
          content.current,
        );
        gsap.set(rises, { opacity: 0, y: 28 });
        gsap.to(rises, {
          opacity: 1,
          y: 0,
          duration: DURATION.slow,
          ease: EASE,
          delay: 0.35,
          stagger: 0.35,
        });

        gsap.set(".hero-cta", { opacity: 0, y: 28 });
        gsap.to(".hero-cta", {
          opacity: 1,
          y: 0,
          duration: DURATION.slow,
          ease: EASE,
          delay: 1.05,
        });

        // Leaving the hero: cover becomes an editorial plate.
        gsap.to(frame.current, {
          scale: 0.92,
          borderRadius: 32,
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      return () => media.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      data-surface="inverse"
      className="relative h-[100svh] min-h-[560px] w-full"
    >
      <div
        ref={frame}
        className="absolute inset-0 overflow-hidden will-change-transform"
      >
        <div ref={photo} className="absolute inset-0 will-change-transform">
          <Image
            src={HERO.image.src}
            alt={HERO.image.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {/* Holds the transparent nav legible over a bright sky. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/40 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/60 via-black/25 to-transparent"
        />
      </div>

      <Container className="relative flex h-full flex-col justify-end pb-[clamp(2.5rem,7vh,5.5rem)]">
        <div ref={content} className="text-on-inverse">
          <div data-reveal-rise="">
            <Eyebrow tone="inverse">{HERO.eyebrow}</Eyebrow>
          </div>

          <TextReveal
            as="h1"
            lines={HERO.headline}
            trigger="load"
            delay={0.5}
            className="mt-6 max-w-[15ch] font-display text-hero"
          />

          <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-12 lg:items-end">
            <div data-reveal-rise="" className="hero-cta lg:col-span-4">
              <PillButton
                href={HERO.cta.href}
                variant="onDark"
                withArrow
                magnetic
              >
                {HERO.cta.label}
              </PillButton>
            </div>
            <p
              data-reveal-rise=""
              className="max-w-[42ch] text-body-lg text-on-inverse/85 lg:col-span-4 lg:col-start-9"
            >
              {HERO.support}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
