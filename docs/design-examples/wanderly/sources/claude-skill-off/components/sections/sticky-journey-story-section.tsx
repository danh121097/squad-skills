"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { ImageReveal } from "@/components/motion/image-reveal";
import { Reveal } from "@/components/motion/reveal";
import { cx } from "@/lib/cx";
import { ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";
import { chapters } from "@/lib/content/journey";

/**
 * The held frame: one photograph stays put on the left while the four
 * chapters pass on the right, each swap a crossfade with a little scale
 * and blur behind it. Below the breakpoint it unfolds into the plain
 * sequence — picture, words, picture, words.
 */
export function StickyJourneyStorySection() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || reduced || motionIsReduced()) return;

    const articles = Array.from(
      el.querySelectorAll<HTMLElement>("[data-chapter]"),
    );

    const triggers = articles.map((article, index) =>
      ScrollTrigger.create({
        trigger: article,
        start: "top 58%",
        end: "bottom 58%",
        onToggle: (self) => {
          if (self.isActive) setActive(index);
        },
      }),
    );

    return () => triggers.forEach((trigger) => trigger.kill());
  }, [reduced]);

  return (
    <section className="wrap pb-[clamp(80px,11vw,140px)]">
      <Reveal>
        <h2 className="eyebrow text-muted">The week, in four moments</h2>
      </Reveal>

      <div ref={root} className="mt-10 md:mt-16 md:grid md:grid-cols-12 md:gap-x-8">
        <div className="hidden md:col-span-5 md:block">
          <div className="sticky top-[13vh] h-[74svh] overflow-hidden rounded-[6px]">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.index}
                aria-hidden={index !== active}
                className={cx(
                  "absolute inset-0 transition-[opacity,transform,filter] duration-[1200ms] ease-editorial will-change-transform",
                  index === active
                    ? "scale-100 opacity-100 blur-0"
                    : "scale-[1.07] opacity-0 blur-[8px]",
                )}
              >
                <Image
                  src={chapter.image}
                  alt={index === active ? chapter.alt : ""}
                  fill
                  sizes="(min-width: 768px) 42vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-6 md:col-start-8">
          {chapters.map((chapter, index) => (
            <article
              key={chapter.index}
              data-chapter
              className="flex flex-col justify-center border-t border-ink/10 py-14 first:border-t-0 md:min-h-[78svh] md:border-t-0 md:py-16"
            >
              <ImageReveal
                src={chapter.image}
                alt={chapter.alt}
                sizes="100vw"
                reveal="clip"
                className="mb-9 aspect-[4/3] rounded-[6px] md:hidden"
              />

              <span
                aria-hidden="true"
                className={cx(
                  "display text-[clamp(52px,9vw,116px)] leading-none transition-colors duration-[1000ms] ease-editorial",
                  index === active ? "text-ember/45" : "text-ink/12",
                )}
              >
                {chapter.index}
              </span>
              <h3 className="display mt-5 max-w-[16ch] text-[clamp(28px,4vw,54px)] leading-[1.04]">
                {chapter.title}
              </h3>
              <p className="mt-6 max-w-[44ch] text-[16px] leading-[1.6] text-muted md:text-[17px]">
                {chapter.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
