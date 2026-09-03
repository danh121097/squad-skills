import { MagneticButton } from "@/components/motion/magnetic-button";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";

/** Two lines, two ways in, and nothing else competing for attention. */
export function FinalCtaSection() {
  return (
    <section
      id="about"
      className="bg-forest text-canvas"
    >
      <div className="wrap flex min-h-[80svh] flex-col justify-center py-[clamp(96px,14vw,180px)]">
        <TextReveal
          as="h2"
          lines={["The world", "is waiting."]}
          className="display text-[clamp(48px,10vw,150px)] leading-[0.94]"
        />

        <div className="mt-12 flex flex-col gap-10 md:mt-16 md:flex-row md:items-end md:justify-between">
          <Reveal delay={0.1}>
            <p className="max-w-[34ch] text-[16px] leading-[1.6] text-canvas/55 md:text-[18px]">
              Find a journey worth remembering.
            </p>
          </Reveal>

          <Reveal
            delay={0.15}
            stagger={0.1}
            className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <MagneticButton href="#journeys" variant="onDark" withArrow>
              Explore journeys
            </MagneticButton>
            <MagneticButton href="#about" variant="bare">
              Talk to a travel designer
            </MagneticButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
