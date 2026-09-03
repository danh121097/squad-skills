"use client";

import { useRef } from "react";

import { Container } from "@/components/ui/container";
import { MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { INTRO_STATEMENT } from "@/lib/content/site";

/**
 * The first breath after the cover: type only, no photograph, no card.
 *
 * Each line brightens from 0.2 to full as it reaches the middle of the screen,
 * scrubbed, so reading pace and scroll pace are the same thing. Under reduced
 * motion every line simply sits at full opacity — the dimming is the animation,
 * so removing the animation removes the dimming rather than leaving text at 20%
 * contrast forever.
 *
 * Lines two and four are indented. That indent is the only "layout" in the
 * section and it is what stops four stacked lines reading as a paragraph.
 */
export function IntroStatement() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const lines = gsap.utils.toArray<HTMLElement>(
          "[data-dim-line]",
          section.current,
        );

        lines.forEach((line) => {
          gsap.fromTo(
            line,
            { opacity: 0.2 },
            {
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: line,
                start: "top 78%",
                end: "top 42%",
                scrub: true,
              },
            },
          );
        });
      });

      return () => media.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      aria-labelledby="intro-statement"
      className="py-[clamp(6rem,16vw,12.5rem)]"
    >
      <Container>
        <h2
          id="intro-statement"
          className="max-w-[18ch] font-display text-statement"
        >
          {INTRO_STATEMENT.map((line, index) => (
            <span
              key={line}
              data-dim-line=""
              className={`block ${index % 2 === 1 ? "pl-[6vw] lg:pl-[10vw]" : ""}`}
            >
              {line}
            </span>
          ))}
        </h2>
      </Container>
    </section>
  );
}
