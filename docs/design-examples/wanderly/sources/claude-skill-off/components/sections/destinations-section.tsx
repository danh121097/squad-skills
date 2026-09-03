"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { cx } from "@/lib/cx";
import { destinations } from "@/lib/content/destinations";

/**
 * An asymmetric showcase rather than a grid: one tall frame on the left,
 * a landscape crop up on the right, the caption beneath it, and the four
 * names running full width underneath. Pointing at a name moves the
 * photography.
 */
export function DestinationsSection() {
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const current = destinations[active];

  return (
    <section id="destinations" className="wrap pb-[clamp(80px,11vw,140px)]">
      <header className="grid gap-8 md:grid-cols-12 md:items-end">
        <Reveal className="md:col-span-3">
          <p className="eyebrow text-muted">Places worth getting lost in</p>
        </Reveal>
        <TextReveal
          as="h2"
          lines={["Not just destinations.", "Stories waiting to happen."]}
          className="display text-[clamp(32px,6vw,80px)] leading-[1.02] md:col-span-9"
        />
      </header>

      <div className="mt-14 grid gap-x-8 gap-y-10 md:mt-20 md:grid-cols-12">
        {/* Left: the tall frame. */}
        <Reveal
          duration={1.1}
          className="relative aspect-[4/5] overflow-hidden rounded-[6px] md:col-span-7 md:aspect-[4/4.7]"
        >
          <DestinationLayers
            activeId={current.id}
            engaged={engaged}
            sizes="(min-width: 768px) 56vw, 100vw"
            position="tall"
          />
        </Reveal>

        {/* Right: landscape crop held high, caption dropped to the foot of
            the tall frame. The air between them is the composition. */}
        <div className="md:col-span-4 md:col-start-9 md:flex md:flex-col md:pt-10">
          <Reveal
            delay={0.1}
            duration={1.1}
            className="relative aspect-[4/3] overflow-hidden rounded-[6px]"
          >
            <DestinationLayers
              activeId={current.id}
              engaged={engaged}
              sizes="(min-width: 768px) 30vw, 100vw"
              position="wide"
            />
          </Reveal>

          {/* A photographer's caption — the editorial line belongs to the
              list below, and saying it twice would read as filler. */}
          <div
            key={current.id}
            className="rise-in mt-6 border-t border-ink/12 pt-5 md:mt-auto md:pt-6"
          >
            <p className="eyebrow text-ink">
              {current.name}
              <span className="text-muted">&nbsp;— {current.country}</span>
            </p>
            <p className="mt-4 text-[13px] text-muted">Best light, {current.season}</p>
          </div>
        </div>
      </div>

      {/* The navigator. */}
      <ul className="mt-16 border-t border-ink/12 md:mt-24">
        {destinations.map((destination, index) => (
          <li key={destination.id} className="border-b border-ink/12">
            <a
              href="#journeys"
              onMouseEnter={() => {
                setActive(index);
                setEngaged(true);
              }}
              onMouseLeave={() => setEngaged(false)}
              onFocus={() => {
                setActive(index);
                setEngaged(true);
              }}
              onBlur={() => setEngaged(false)}
              className="group block py-7 md:grid md:grid-cols-12 md:items-center md:gap-6 md:py-9"
            >
              <div className="flex items-baseline gap-5 md:col-span-6">
                <span
                  className={cx(
                    "eyebrow transition-colors duration-700 ease-editorial",
                    index === active ? "text-ember" : "text-muted",
                  )}
                >
                  {destination.index}
                </span>
                <h3 className="display text-[clamp(30px,5.6vw,66px)] leading-[1.02] transition-transform duration-[900ms] ease-editorial group-hover:translate-x-2">
                  {destination.name}
                </h3>
              </div>
              <p className="eyebrow mt-3 text-muted md:col-span-2 md:mt-0">
                {destination.country}
              </p>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.55] text-muted md:col-span-3 md:mt-0">
                {destination.line}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[13px] md:col-span-1 md:mt-0 md:justify-self-end">
                Explore
                <ArrowRight
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1"
                />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

type LayerProps = {
  activeId: string;
  engaged: boolean;
  sizes: string;
  position: "tall" | "wide";
};

/** Stacked crops that cross-fade; the live one lifts a little on hover. */
function DestinationLayers({ activeId, engaged, sizes, position }: LayerProps) {
  return (
    <>
      {destinations.map((destination) => {
        const isActive = destination.id === activeId;
        return (
          <div
            key={destination.id}
            aria-hidden={!isActive}
            className={cx(
              "absolute inset-0 transition-[opacity,transform] duration-[1200ms] ease-editorial will-change-transform",
              isActive
                ? engaged
                  ? "scale-[1.035] opacity-100 -translate-y-1.5"
                  : "scale-100 opacity-100"
                : "scale-[1.06] opacity-0",
            )}
          >
            <Image
              src={destination.image}
              alt={isActive ? destination.alt : ""}
              fill
              sizes={sizes}
              className={cx(
                "object-cover",
                position === "wide" ? "object-[50%_35%]" : "object-center",
              )}
            />
          </div>
        );
      })}
    </>
  );
}
