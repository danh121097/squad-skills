import { ImageReveal } from "@/components/motion/image-reveal";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { TextReveal } from "@/components/motion/text-reveal";

const details = [
  ["7", "days"],
  ["4", "boutique stays"],
  ["12", "experiences"],
  ["8", "travelers max"],
] as const;

export function FeaturedJourney() {
  return (
    <section className="featured section-shell" aria-labelledby="featured-title">
      <div className="featured-intro">
        <p className="eyebrow">Featured journey</p>
        <TextReveal as="h2" className="section-title" text={["Seven days in", "the slower side", "of Bali."]} />
      </div>
      <div className="featured-layout">
        <ImageReveal
          src="/assets/journey-bali.jpg"
          alt="A quiet tropical retreat in Bali"
          sizes="(max-width: 767px) 100vw, 68vw"
          className="featured-image"
          imageClassName="cover-image"
          mode="clip"
        />
        <div className="featured-copy">
          <p>Move between jungle, coast and quiet villages on a journey designed around time, not a checklist.</p>
          <dl>
            {details.map(([value, label]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
          <div className="featured-price"><span>From</span><strong>$1,240</strong></div>
          <MagneticButton href="#story" variant="text">Discover the journey</MagneticButton>
        </div>
      </div>
    </section>
  );
}
