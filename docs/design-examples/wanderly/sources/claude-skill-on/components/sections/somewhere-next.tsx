"use client";

import Image from "next/image";
import { useRef } from "react";

import { TextReveal } from "@/components/motion/text-reveal";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { SOMEWHERE_NEXT } from "@/lib/content/site";

/**
 * The transition into the close: a plate that grows into the full screen as you
 * scroll, radius falling 40px → 0.
 *
 * Deliberately the inverse of the hero, which shrinks into a plate on the way
 * out. Reading top to bottom the page therefore opens full-bleed, contracts, and
 * expands again at the end — the same gesture bookending the piece rather than a
 * second unrelated effect.
 *
 * Under reduced motion the plate simply sits at its final size: the section
 * still holds a full-screen photograph and its title, it just does not travel.
 */
export function SomewhereNext() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        gsap.fromTo(
          frame.current,
          { scale: 0.88, borderRadius: 40 },
          {
            scale: 1,
            borderRadius: 0,
            ease: "none",
            scrollTrigger: {
              trigger: section.current,
              start: "top bottom",
              end: "center center",
              scrub: true,
            },
          },
        );
      });

      return () => media.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      aria-labelledby="somewhere-next-heading"
      data-surface="inverse"
      className="relative h-[100svh] min-h-[540px] w-full overflow-hidden"
    >
      <div
        ref={frame}
        className="absolute inset-0 overflow-hidden will-change-transform"
      >
        <Image
          src={SOMEWHERE_NEXT.image.src}
          alt={SOMEWHERE_NEXT.image.alt}
          fill
          sizes="100vw"
          loading="lazy"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/25"
        />
      </div>

      <Container className="relative flex h-full flex-col items-center justify-center text-center text-on-inverse">
        <Eyebrow tone="inverse">{SOMEWHERE_NEXT.eyebrow}</Eyebrow>
        <TextReveal
          as="h2"
          id="somewhere-next-heading"
          lines={SOMEWHERE_NEXT.headline}
          start="top 70%"
          className="mt-8 font-display text-section"
        />
      </Container>
    </section>
  );
}
