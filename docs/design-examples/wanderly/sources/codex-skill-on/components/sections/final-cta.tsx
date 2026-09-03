import { MagneticButton } from "@/components/motion/magnetic-button";
import { TextReveal } from "@/components/motion/text-reveal";

export function FinalCta() {
  return (
    <section id="final-cta" className="bg-[var(--night)] py-[clamp(8rem,15vw,14rem)] text-[var(--surface)]" aria-labelledby="final-heading">
      <div className="page-shell">
        <TextReveal as="h2" id="final-heading" lines={["The world", "is waiting."]} className="font-editorial text-[clamp(5rem,12vw,12rem)] leading-[0.82] tracking-[-0.06em]" />
        <div className="mt-14 flex flex-col items-start justify-between gap-9 border-t border-white/15 pt-8 md:flex-row md:items-center">
          <p className="max-w-sm text-base leading-7 text-white/60">Find a journey worth remembering.</p>
          <div className="flex flex-wrap gap-3">
            <MagneticButton tone="light">Explore journeys</MagneticButton>
            <MagneticButton tone="outline" secondary>Talk to a travel designer</MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
