"use client";

import { useState } from "react";

import { ImageReveal } from "@/components/motion/image-reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { DESTINATIONS, DESTINATIONS_INTRO } from "@/lib/content/destinations";

/** Explicit rows keep the desktop spread deterministic rather than leaving the
 *  auto-placement algorithm to resolve four overlapping figures. */
const TEXT_ROWS = [
  "lg:row-start-2",
  "lg:row-start-3",
  "lg:row-start-4",
  "lg:row-start-5",
] as const;

/**
 * A magazine spread, not a grid of cards.
 *
 * One DOM, two layouts. On mobile each destination is its own editorial block:
 * portrait photograph, name, country, sentence. At `lg` the wrapper becomes
 * `display: contents`, which drops each destination's children directly into
 * the section grid — all four portraits land in the same cell (column 1, rows
 * 1→5) and overlap, the landscape companion crops sit top right, and the four
 * text blocks stack down the right column.
 *
 * Because the whole exchange is CSS plus one index of local state, it works
 * with JavaScript disabled, works under reduced motion (the crossfade simply
 * becomes a cut), and never hides a destination's words behind a hover: every
 * name, country and sentence is on the page at all times. Hover and keyboard
 * focus are two routes to the same `active` index, so the photograph responds
 * to the Tab key exactly as it responds to the pointer.
 */
export function Destinations() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="destinations"
      aria-labelledby="destinations-heading"
      className="py-[clamp(5rem,12vw,10rem)]"
    >
      <Container>
        {/* Deliberately no `ch` max-width on this wrapper: `ch` resolves
            against the 16px sans here rather than the display serif inside it,
            which would crush an 80px heading into a ~400px column. The authored
            line breaks set the measure. */}
        <div className="mb-[clamp(3rem,7vw,6rem)]">
          <Eyebrow>{DESTINATIONS_INTRO.eyebrow}</Eyebrow>
          <TextReveal
            as="h2"
            id="destinations-heading"
            lines={DESTINATIONS_INTRO.heading}
            className="mt-8 font-display text-section"
          />
        </div>

        <div className="grid gap-16 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
          {DESTINATIONS.map((destination, index) => {
            const isActive = index === active;
            const activate = () => setActive(index);

            return (
              <div key={destination.name} className="lg:contents">
                {/* Portrait stage. All four occupy one cell at lg. */}
                <ImageReveal
                  src={destination.image.src}
                  alt={destination.image.alt}
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  reveal={index === 0 ? "scale" : "none"}
                  cursorLabel
                  className={`aspect-[4/5] rounded-[6px] transition-[opacity,transform] duration-[900ms] ease-editorial motion-reduce:transition-none lg:col-start-1 lg:col-span-6 lg:[grid-row:1/6] lg:sticky lg:top-[12vh] lg:aspect-auto lg:h-[74svh] ${
                    isActive
                      ? "lg:opacity-100 lg:scale-100"
                      : "lg:pointer-events-none lg:opacity-0 lg:scale-[1.03]"
                  }`}
                />

                {/* Companion crop: the same photograph, framed landscape, the
                    way a spread repeats a picture at a different size. Decorative
                    by definition, so it is hidden from assistive technology. */}
                <div
                  aria-hidden="true"
                  className={`hidden lg:col-start-8 lg:col-span-5 lg:[grid-row:1] lg:block lg:self-start ${
                    isActive ? "" : "lg:pointer-events-none"
                  }`}
                >
                  <ImageReveal
                    src={destination.image.src}
                    alt=""
                    sizes="38vw"
                    reveal="none"
                    imageClassName="object-[50%_30%]"
                    className={`aspect-[5/4] rounded-[6px] transition-[opacity,transform] duration-[900ms] ease-editorial motion-reduce:transition-none ${
                      isActive
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-3"
                    }`}
                  />
                </div>

                <div
                  onMouseEnter={activate}
                  onFocusCapture={activate}
                  className={`flex flex-col justify-center border-t border-rule py-7 lg:col-start-8 lg:col-span-5 ${TEXT_ROWS[index]}`}
                >
                  <div className="flex items-baseline justify-between gap-6">
                    <h3
                      className={`font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.05] transition-opacity duration-500 ease-editorial motion-reduce:transition-none ${
                        isActive ? "opacity-100" : "lg:opacity-45"
                      }`}
                    >
                      {destination.name}
                    </h3>
                    <span className="shrink-0 text-label uppercase text-secondary">
                      {destination.country}
                    </span>
                  </div>

                  <p className="mt-4 max-w-[38ch] text-body text-secondary">
                    {destination.line}
                  </p>

                  <ArrowLink
                    href={destination.href}
                    size="sm"
                    className="mt-6"
                  >
                    <span className="sr-only">{destination.name}: </span>
                    Explore
                  </ArrowLink>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
