"use client";

import Image from "next/image";
import { useRef } from "react";

import { TextReveal } from "@/components/motion/text-reveal";
import { Container } from "@/components/ui/container";
import { MOTION_OK_DESKTOP, ScrollTrigger, gsap, useGSAP } from "@/lib/motion";
import { EXPERIENCES, EXPERIENCES_INTRO } from "@/lib/content/experiences";

/**
 * The dark gatefold in the middle of the issue.
 *
 * The honest version of scroll-driven horizontal movement is: build the native
 * one first, then enhance it. The track is a real horizontally scrollable region
 * in CSS with scroll snapping — that is what mobile gets, what reduced-motion
 * users get, and what runs if the JavaScript never arrives. Only on a desktop
 * viewport with no motion preference does the section pin and convert vertical
 * distance into horizontal travel, and `gsap.matchMedia()` owns that branch, so
 * shrinking the window or switching on the preference reverts the pin and the
 * `overflow` override together.
 *
 * The panels carry no links. That is deliberate: pinning a region that contains
 * focusable elements is how scroll hijacking traps keyboard users, and there is
 * nothing here a reader needs to activate.
 */
export function Experiences() {
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK_DESKTOP, () => {
        const viewportEl = viewport.current;
        const trackEl = track.current;
        if (!viewportEl || !trackEl) return;

        // Hand scrolling over to the timeline for the duration of the branch.
        // gsap.set inside matchMedia is reverted automatically on teardown.
        gsap.set(viewportEl, { overflowX: "hidden" });

        const distance = () =>
          Math.max(0, trackEl.scrollWidth - viewportEl.clientWidth);

        gsap.to(trackEl, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Fonts and images settling change the track width; recompute once idle.
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
      });

      return () => media.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      id="journeys"
      aria-labelledby="experiences-heading"
      data-surface="inverse"
      className="flex min-h-[100svh] flex-col justify-center overflow-hidden bg-surface-inverse py-[clamp(4rem,9vw,7rem)] text-on-inverse"
    >
      <Container>
        <TextReveal
          as="h2"
          id="experiences-heading"
          lines={EXPERIENCES_INTRO.heading}
          className="max-w-[16ch] font-display text-section"
        />
      </Container>

      <div
        ref={viewport}
        tabIndex={0}
        role="group"
        aria-label="Kinds of escape — scroll horizontally"
        className="mt-[clamp(2.5rem,6vw,5rem)] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul
          ref={track}
          className="flex w-max gap-4 px-5 will-change-transform md:gap-6 md:px-8 lg:px-12 xl:px-20"
        >
          {EXPERIENCES.map((experience, index) => (
            <li
              key={experience.title}
              className="relative h-[62svh] w-[78vw] shrink-0 snap-center overflow-hidden rounded-[8px] sm:w-[58vw] lg:h-[64svh] lg:w-[38vw]"
            >
              <Image
                src={experience.image.src}
                alt={experience.image.alt}
                fill
                sizes="(min-width: 1024px) 38vw, (min-width: 640px) 58vw, 78vw"
                loading={index === 0 ? "eager" : "lazy"}
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-7 lg:p-9">
                <span className="text-label font-medium uppercase text-accent-warm">
                  {experience.index}
                </span>
                <h3 className="mt-4 font-display text-[clamp(2rem,3.4vw,3rem)] leading-[1.02] text-white">
                  {experience.title}
                </h3>
                <p className="mt-3 max-w-[26ch] text-body text-white/80">
                  {experience.line}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
