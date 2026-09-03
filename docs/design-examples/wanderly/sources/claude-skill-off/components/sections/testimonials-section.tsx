"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { cx } from "@/lib/cx";
import { useReducedMotion } from "@/lib/hooks/use-media-query";
import { testimonials } from "@/lib/content/testimonials";

const INTERVAL = 8000;

/**
 * No testimonial cards. One quote at editorial scale, fading and lifting
 * as it changes, with a hairline progress rule beneath it. Auto-advance
 * stands down whenever motion is reduced.
 */
export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const current = testimonials[index];

  const go = useCallback((direction: 1 | -1) => {
    setIndex((value) => (value + direction + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (reduced || paused) return;
    const timer = window.setInterval(() => go(1), INTERVAL);
    return () => window.clearInterval(timer);
  }, [reduced, paused, go, index]);

  return (
    <section
      aria-label="Travellers"
      className="wrap py-[clamp(80px,11vw,140px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Reveal>
        <p className="eyebrow text-muted">In their words</p>
      </Reveal>

      <div className="mt-12 md:mt-16 md:pl-[8%]">
        {/* The live region has to outlive the slide, so the keyed remount
            that replays the animation sits inside it. */}
        <blockquote aria-live="polite">
          <div key={current.id}>
          {/* The authored breaks are a desktop composition; narrow screens
              let the sentence set itself rather than break twice over. */}
          <p className="display text-[clamp(28px,4.6vw,64px)] leading-[1.12]">
            {current.quoteLines.map((line, lineIndex) => (
              <span
                key={line}
                className="rise-in md:block"
                style={{ animationDelay: `${lineIndex * 90}ms` }}
              >
                {line}
                {lineIndex < current.quoteLines.length - 1 ? " " : null}
              </span>
            ))}
          </p>

          <footer className="rise-in mt-10 flex items-center gap-5" style={{ animationDelay: "260ms" }}>
            <span className="flex -space-x-3">
              {current.avatars.map((avatar, avatarIndex) => (
                <span
                  key={avatar}
                  className="relative size-10 overflow-hidden rounded-full ring-2 ring-canvas"
                >
                  <Image
                    src={avatar}
                    alt={avatarIndex === 0 ? current.avatarAlt : ""}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
              ))}
            </span>
            <span>
              <cite className="block text-[15px] not-italic">{current.names}</cite>
              <span className="mt-1 block text-[13px] text-muted">{current.route}</span>
            </span>
          </footer>
          </div>
        </blockquote>

        <div className="mt-14 flex items-center justify-between gap-8">
          <ol className="flex flex-1 items-center gap-2" aria-hidden="true">
            {testimonials.map((testimonial, dotIndex) => (
              <li key={testimonial.id} className="h-px flex-1 bg-ink/15">
                <span
                  className={cx(
                    "block h-px origin-left bg-ink transition-transform duration-[900ms] ease-editorial",
                    dotIndex <= index ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </li>
            ))}
          </ol>

          <div className="flex items-center gap-2">
            <CarouselButton label="Previous traveller" onClick={() => go(-1)}>
              <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </CarouselButton>
            <CarouselButton label="Next traveller" onClick={() => go(1)}>
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </CarouselButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-cursor="button"
      className="inline-flex size-11 items-center justify-center rounded-full border border-ink/15 transition-colors duration-500 ease-editorial hover:border-ink/45"
    >
      {children}
    </button>
  );
}
