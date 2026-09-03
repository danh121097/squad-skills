import { MagneticButton } from "@/components/motion/magnetic-button";
import { TextReveal } from "@/components/motion/text-reveal";

export function FinalCta() {
  return (
    <section id="about" className="final-cta" aria-labelledby="final-title">
      <TextReveal as="h2" className="final-title" text={["The world", "is waiting."]} />
      <div className="final-actions">
        <p>Find a journey worth remembering.</p>
        <div>
          <MagneticButton href="#destinations" variant="light">Explore journeys</MagneticButton>
          <a className="secondary-link" href="mailto:hello@wanderly.example">Talk to a travel designer</a>
        </div>
      </div>
    </section>
  );
}
