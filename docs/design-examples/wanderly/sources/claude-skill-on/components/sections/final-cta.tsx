import { TextReveal } from "@/components/motion/text-reveal";
import { Container } from "@/components/ui/container";
import { PillButton } from "@/components/ui/pill-button";
import { FINAL_CTA } from "@/lib/content/site";

/**
 * The close. Not centred — the headline holds the left of the grid and the two
 * actions sit against the baseline on the right, so the last screen still has a
 * composition rather than a stack of centred elements.
 *
 * Both controls are magnetic, and the hierarchy between them is carried by fill
 * versus hairline rather than by size, so "Talk to a travel designer" reads as a
 * genuine alternative instead of a discouraged one.
 */
export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      data-surface="inverse"
      className="bg-surface-inverse py-[clamp(6rem,15vw,12rem)] text-on-inverse"
    >
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:items-end lg:gap-x-12">
          <TextReveal
            as="h2"
            id="final-cta-heading"
            lines={FINAL_CTA.headline}
            className="font-display text-section lg:col-span-7"
          />

          <div className="flex flex-col gap-8 lg:col-span-4 lg:col-start-9 lg:pb-3">
            <p className="text-body-lg text-on-inverse-muted">
              {FINAL_CTA.support}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <PillButton
                href={FINAL_CTA.primary.href}
                variant="onDark"
                withArrow
                magnetic
              >
                {FINAL_CTA.primary.label}
              </PillButton>
              <PillButton
                href={FINAL_CTA.secondary.href}
                variant="outlineOnDark"
                magnetic
              >
                {FINAL_CTA.secondary.label}
              </PillButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
