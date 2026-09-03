"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { TextReveal } from "@/components/motion/text-reveal";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  DURATION,
  EASE,
  MOTION_OK_DESKTOP,
  ScrollTrigger,
  gsap,
  useGSAP,
} from "@/lib/motion";
import { CHAPTERS, CHAPTERS_INTRO } from "@/lib/content/journey";

/**
 * Apple-style chapter storytelling: one photograph holds still on the left while
 * four chapters pass on the right.
 *
 * Same single-DOM approach as the destinations spread, but gated on
 * `motion-safe` as well as `lg`. Under reduced motion — at any width — the
 * wrapper stays a normal block and the section reads image, text, image, text,
 * which is also exactly what mobile gets. That matters because the sticky
 * version depends on a crossfade to reveal each photograph in turn: without
 * animation, four stacked images in one grid cell would show only the last one.
 * Removing the motion therefore has to remove the layout that assumed it.
 *
 * The transition is crossfade + scale + a small blur, never a cut. Blur is the
 * one expensive property here, so it is short, small, and confined to the branch
 * that already requires a desktop GPU.
 */
export function JourneyChapters() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK_DESKTOP, () => {
        const triggers = gsap.utils
          .toArray<HTMLElement>("[data-chapter-copy]", section.current)
          .map((copy, index) =>
            ScrollTrigger.create({
              trigger: copy,
              start: "top 62%",
              end: "bottom 62%",
              onToggle: (self) => {
                if (self.isActive) setActive(index);
              },
            }),
          );

        return () => triggers.forEach((trigger) => trigger.kill());
      });

      return () => media.revert();
    },
    { scope: section },
  );

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK_DESKTOP, () => {
        const visuals = gsap.utils.toArray<HTMLElement>(
          "[data-chapter-visual]",
          section.current,
        );

        visuals.forEach((visual, index) => {
          gsap.to(visual, {
            opacity: index === active ? 1 : 0,
            scale: index === active ? 1 : 1.05,
            filter: index === active ? "blur(0px)" : "blur(8px)",
            duration: DURATION.slow,
            ease: EASE,
            overwrite: "auto",
          });
        });
      });

      return () => media.revert();
    },
    { dependencies: [active], scope: section },
  );

  return (
    <section
      ref={section}
      aria-labelledby="chapters-heading"
      className="py-[clamp(5rem,12vw,10rem)]"
    >
      <Container>
        <div className="mb-[clamp(3rem,7vw,5.5rem)]">
          <Eyebrow>{CHAPTERS_INTRO.eyebrow}</Eyebrow>
          <TextReveal
            as="h2"
            id="chapters-heading"
            lines={CHAPTERS_INTRO.heading}
            className="mt-8 font-display text-section"
          />
        </div>

        <div className="grid gap-16 motion-safe:lg:grid-cols-12 motion-safe:lg:gap-x-12 motion-safe:lg:gap-y-0">
          {CHAPTERS.map((chapter, index) => (
            <div key={chapter.index} className="motion-safe:lg:contents">
              <figure
                data-chapter-visual={index}
                className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-primary/5 will-change-[opacity,transform] motion-safe:lg:col-start-1 motion-safe:lg:col-span-6 motion-safe:lg:[grid-row:1/5] motion-safe:lg:sticky motion-safe:lg:top-[13vh] motion-safe:lg:aspect-auto motion-safe:lg:h-[74svh]"
              >
                <Image
                  src={chapter.image.src}
                  alt={chapter.image.alt}
                  fill
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  loading={index === 0 ? "eager" : "lazy"}
                  className="object-cover"
                />
              </figure>

              <div
                data-chapter-copy=""
                className="motion-safe:lg:col-start-8 motion-safe:lg:col-span-5 motion-safe:lg:flex motion-safe:lg:min-h-[100svh] motion-safe:lg:flex-col motion-safe:lg:justify-center"
              >
                <span
                  aria-hidden="true"
                  className="block font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none text-accent"
                >
                  {chapter.index}
                </span>
                <h3 className="mt-5 max-w-[18ch] font-display text-chapter">
                  <span className="sr-only">
                    {`Chapter ${chapter.index}: `}
                  </span>
                  {chapter.headline}
                </h3>
                <p className="mt-5 max-w-[42ch] text-body-lg text-secondary">
                  {chapter.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
