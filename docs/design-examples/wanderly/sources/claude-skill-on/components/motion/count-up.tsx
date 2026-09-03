"use client";

import { useRef } from "react";

import { EASE, MOTION_OK, gsap, useGSAP } from "@/lib/motion";

type CountUpProps = {
  value: number;
  /** Decimal places, so 4.9 counts as 4.9 rather than snapping to 5. */
  decimals?: number;
  suffix?: string;
  className?: string;
};

/**
 * Counts a numeral up when it first enters the viewport.
 *
 * The finished value is what the server renders, so the number is correct
 * before hydration, correct without JavaScript, and correct under reduced
 * motion — the animation only ever rewinds a value that is already there. The
 * suffix sits outside the animated node so "18" can count while "K+" stays put.
 */
export function CountUp({
  value,
  decimals = 0,
  suffix,
  className,
}: CountUpProps) {
  const numeral = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const el = numeral.current;
        if (!el) return;

        const counter = { current: 0 };
        const format = (input: number) =>
          input.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });

        gsap.to(counter, {
          current: value,
          duration: 2,
          ease: EASE,
          onUpdate: () => {
            el.textContent = format(counter.current);
          },
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });

        return () => {
          el.textContent = format(value);
        };
      });

      return () => media.revert();
    },
    { scope: numeral },
  );

  return (
    <span className={className}>
      <span ref={numeral}>
        {value.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
      </span>
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}
