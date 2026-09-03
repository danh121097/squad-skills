"use client";

import Image from "next/image";
import { useRef } from "react";

import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import {
  motionIsReduced,
  useIsDesktop,
  useReducedMotion,
} from "@/lib/hooks/use-media-query";
import { experiences, type Experience } from "@/lib/content/experiences";

/**
 * Four moods, side by side. On a pointer device the vertical scroll is
 * borrowed to travel sideways; on touch — and whenever motion is
 * reduced — it is an ordinary, swipeable horizontal list.
 */
export function HorizontalExperienceSection() {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const isDesktop = useIsDesktop();
  const scrubbed = isDesktop && !reduced;

  useIsomorphicLayoutEffect(() => {
    const outerEl = outer.current;
    const trackEl = track.current;
    if (!outerEl || !trackEl || !scrubbed || motionIsReduced()) return;

    const ctx = gsap.context(() => {
      const distance = () => trackEl.scrollWidth - window.innerWidth;

      const shared = {
        trigger: outerEl,
        start: "top top",
        end: () => `+=${distance()}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
      } as const;

      gsap.to(trackEl, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: shared,
      });

      if (progress.current) {
        gsap.fromTo(
          progress.current,
          { scaleX: 0 },
          { scaleX: 1, ease: "none", scrollTrigger: shared },
        );
      }
    }, outerEl);

    return () => ctx.revert();
  }, [scrubbed]);

  return (
    <section id="journeys" className="bg-forest text-canvas">
      <div className="wrap pt-[clamp(80px,11vw,140px)]">
        <Reveal>
          <p className="eyebrow text-canvas/45">The shape of a trip</p>
        </Reveal>
        <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end">
          <TextReveal
            as="h2"
            lines={["Choose your kind", "of escape."]}
            className="display text-[clamp(38px,7vw,92px)] leading-[1.0] md:col-span-7"
          />
          <Reveal delay={0.1} className="md:col-span-4 md:col-start-9">
            <p className="max-w-[38ch] text-[16px] leading-[1.6] text-canvas/55">
              Every journey we build starts with a feeling rather than a place. Pick
              the one you are short of.
            </p>
          </Reveal>
        </div>
      </div>

      {scrubbed ? (
        <div ref={outer} className="relative mt-24 h-[340vh]">
          <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
            <div
              ref={track}
              className="flex h-[74svh] items-stretch gap-6 pl-[6vw] pr-[6vw] will-change-transform"
            >
              {experiences.map((experience) => (
                <ExperiencePanel key={experience.id} experience={experience} />
              ))}
            </div>

            <div className="wrap mt-12">
              <span className="block h-px w-full bg-canvas/15">
                <span
                  ref={progress}
                  className="block h-px origin-left bg-canvas/70"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          data-lenis-prevent
          className="mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-16 md:mt-20 md:gap-6 md:px-8"
        >
          {experiences.map((experience) => (
            <ExperiencePanel key={experience.id} experience={experience} swipe />
          ))}
        </div>
      )}
    </section>
  );
}

function ExperiencePanel({
  experience,
  swipe = false,
}: {
  experience: Experience;
  swipe?: boolean;
}) {
  return (
    <article
      className={
        swipe
          ? "relative h-[68svh] w-[82vw] shrink-0 snap-center overflow-hidden rounded-[6px] md:w-[52vw]"
          : "relative h-full w-[74vw] shrink-0 overflow-hidden rounded-[6px] xl:w-[62vw]"
      }
    >
      <Image
        src={experience.image}
        alt={experience.alt}
        fill
        sizes={swipe ? "82vw" : "70vw"}
        className="object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-forest/85 via-forest/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-7 md:p-10">
        <span className="eyebrow text-canvas/55">{experience.index}</span>
        <h3 className="display mt-4 text-[clamp(34px,4.4vw,64px)] leading-[1.0]">
          {experience.title}
        </h3>
        <p className="mt-4 max-w-[26ch] text-[15px] leading-[1.55] text-canvas/70 md:text-[17px]">
          {experience.line}
        </p>
      </div>
    </article>
  );
}
