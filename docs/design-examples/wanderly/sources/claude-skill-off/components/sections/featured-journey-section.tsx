import { ImageReveal } from "@/components/motion/image-reveal";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { featuredJourney } from "@/lib/content/journey";

/**
 * One trip, given the room a magazine would give it. The photograph wipes
 * open from the bottom edge and drifts; the column beside it follows a
 * beat later.
 */
export function FeaturedJourneySection() {
  return (
    <section className="wrap py-[clamp(80px,11vw,140px)]">
      <div className="grid gap-6 md:grid-cols-12 md:gap-x-8">
        <Reveal className="md:col-span-3 md:pt-4">
          <p className="eyebrow text-muted">{featuredJourney.eyebrow}</p>
        </Reveal>
        <TextReveal
          as="h2"
          lines={[...featuredJourney.titleLines]}
          className="display text-[clamp(36px,6.6vw,88px)] leading-[1.0] md:col-span-8 md:col-start-4"
        />
      </div>

      <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:gap-x-8">
        <ImageReveal
          src={featuredJourney.image}
          alt={featuredJourney.alt}
          sizes="(min-width: 768px) 66vw, 100vw"
          reveal="clip"
          parallax={0.55}
          cursorView
          className="aspect-[4/3] rounded-[6px] md:col-span-8 md:aspect-[16/11]"
        />

        <div className="md:col-span-3 md:col-start-10 md:flex md:flex-col md:justify-end md:pb-2">
          <Reveal delay={0.15}>
            <p className="max-w-[42ch] text-[16px] leading-[1.6] text-muted md:text-[17px]">
              {featuredJourney.standfirst}
            </p>
          </Reveal>

          <Reveal
            as="dl"
            delay={0.2}
            stagger={0.08}
            className="mt-10 grid grid-cols-2 gap-y-8"
          >
            {featuredJourney.details.map((detail) => (
              <div key={detail.label} className="flex flex-col-reverse gap-3">
                <dt className="eyebrow text-muted">{detail.label}</dt>
                <dd className="display text-[clamp(30px,3.4vw,44px)] leading-none">
                  {detail.value}
                </dd>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.25} className="mt-12 border-t border-ink/12 pt-7">
            <p className="display text-[clamp(26px,2.6vw,34px)] leading-none">
              {featuredJourney.price}
            </p>
            <p className="mt-3 text-[13px] text-muted">{featuredJourney.priceNote}</p>
            <MagneticButton href="#stories" variant="onLight" withArrow className="mt-8">
              {featuredJourney.cta}
            </MagneticButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
