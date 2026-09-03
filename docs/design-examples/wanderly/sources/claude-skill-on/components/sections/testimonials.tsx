"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";

import { Container } from "@/components/ui/container";
import { DURATION, EASE, MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { TESTIMONIALS } from "@/lib/content/proof";

/**
 * A quote at display size, not a testimonial card: no border, no shadow, no
 * quotation-mark graphic, no grid of three smiling strangers.
 *
 * It does not advance on its own. An auto-rotating carousel would need a
 * pause control to satisfy WCAG 2.2 (2.2.2 Pause, Stop, Hide), and adding a
 * pause button to a section this quiet costs more than the automatic movement
 * is worth — so the reader moves it, the region announces politely when they
 * do, and the "progress indicator" is a hairline that fills plus a set numeral.
 */
export function Testimonials() {
  const quoteRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = TESTIMONIALS.length;
  const testimonial = TESTIMONIALS[index];

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        gsap.fromTo(
          quoteRef.current,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: DURATION.base, ease: EASE },
        );
      });

      return () => media.revert();
    },
    { dependencies: [index], scope: quoteRef },
  );

  if (!testimonial) return null;

  const go = (delta: number) =>
    setIndex((current) => (current + delta + total) % total);

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="py-[clamp(5rem,12vw,10rem)]"
    >
      <Container>
        <h2 id="testimonials-heading" className="sr-only">
          What travellers say
        </h2>

        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-9">
            {/* figure/figcaption so the attribution is programmatically tied to
                the quote rather than being a paragraph that happens to sit
                underneath it. */}
            <figure ref={quoteRef} aria-live="polite" aria-atomic="true">
              <blockquote className="font-display text-quote">
                {testimonial.quote.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </blockquote>

              <figcaption className="mt-10 flex items-center gap-5">
                <span className="flex -space-x-2.5">
                  {testimonial.avatars.map((avatar, avatarIndex) => (
                    <span
                      key={avatar.src + avatarIndex}
                      className="relative size-9 overflow-hidden rounded-full ring-2 ring-surface"
                    >
                      <Image
                        src={avatar.src}
                        alt=""
                        aria-hidden="true"
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </span>
                  ))}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[0.9375rem]">
                    {testimonial.travellers}
                  </span>
                  <span className="text-label uppercase text-secondary">
                    {testimonial.route}
                  </span>
                </span>
              </figcaption>
            </figure>
          </div>

          <div className="flex items-end justify-between gap-8 lg:col-span-3 lg:flex-col lg:items-end lg:justify-end">
            <div className="flex w-full max-w-[180px] flex-col gap-3">
              <span className="text-label uppercase text-secondary tabular-nums">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
              <span
                aria-hidden="true"
                className="relative h-px w-full bg-rule"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-700 ease-editorial motion-reduce:transition-none"
                  style={{ width: `${((index + 1) / total) * 100}%` }}
                />
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                data-cursor="button"
                className="inline-flex size-11 items-center justify-center rounded-full border border-rule transition-colors duration-500 ease-editorial hover:border-primary/50 motion-reduce:transition-none"
              >
                <ArrowLeft
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4"
                />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next testimonial"
                data-cursor="button"
                className="inline-flex size-11 items-center justify-center rounded-full border border-rule transition-colors duration-500 ease-editorial hover:border-primary/50 motion-reduce:transition-none"
              >
                <ArrowRight
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4"
                />
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
