import { ImageReveal } from "@/components/motion/image-reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FEATURED_JOURNEY } from "@/lib/content/journey";

/**
 * The full-page feature.
 *
 * The photograph bleeds off the left edge of the viewport instead of sitting
 * politely inside the gutter — the one place on the page where the grid is
 * broken, which is what makes it read as the feature. It occupies about 68% of
 * the width; the remaining column holds the title, the specifics and the price.
 *
 * The clip-path wipe and the parallax both live in ImageReveal, so this section
 * only chooses *that* it reveals and how far it drifts, not how.
 */
export function FeaturedJourney() {
  return (
    <section
      aria-labelledby="featured-journey-heading"
      className="py-[clamp(5rem,12vw,10rem)]"
    >
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-x-12">
        <ImageReveal
          src={FEATURED_JOURNEY.image.src}
          alt={FEATURED_JOURNEY.image.alt}
          sizes="(min-width: 1024px) 68vw, 100vw"
          reveal="clip"
          parallax={5}
          cursorLabel
          className="aspect-[4/5] rounded-r-[8px] sm:aspect-[3/2] lg:col-span-8 lg:aspect-[5/6] lg:h-[86svh]"
        />

        {/* The true remainder of the 8-column image. A column narrower forced
            the title's second authored line to wrap, which turned a three-line
            title into a ragged four. */}
        <div className="px-5 md:px-8 lg:col-span-4 lg:col-start-9 lg:px-0 lg:pr-12 xl:pr-20">
          <Eyebrow>{FEATURED_JOURNEY.eyebrow}</Eyebrow>

          <TextReveal
            as="h2"
            id="featured-journey-heading"
            lines={FEATURED_JOURNEY.title}
            className="mt-7 font-display text-[clamp(2.25rem,3.5vw,3.25rem)] leading-[1.02] tracking-[-0.018em]"
          />

          <p className="mt-7 max-w-[40ch] text-body text-secondary">
            {FEATURED_JOURNEY.description}
          </p>

          <dl className="mt-10 border-t border-rule">
            {FEATURED_JOURNEY.details.map((detail) => (
              <div
                key={detail.label}
                className="flex items-baseline justify-between gap-6 border-b border-rule py-3.5"
              >
                <dt className="text-label uppercase text-secondary">
                  {detail.label}
                </dt>
                <dd className="text-[0.9375rem]">{detail.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-9 flex items-baseline gap-3">
            <span className="text-label uppercase text-secondary">
              {FEATURED_JOURNEY.price.prefix}
            </span>
            <span className="font-display text-[clamp(2rem,3vw,2.75rem)] leading-none">
              {FEATURED_JOURNEY.price.value}
            </span>
          </p>

          <ArrowLink href={FEATURED_JOURNEY.cta.href} className="mt-9">
            {FEATURED_JOURNEY.cta.label}
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
