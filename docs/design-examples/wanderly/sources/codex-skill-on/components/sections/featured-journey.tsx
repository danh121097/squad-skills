import { ArrowUpRight } from "lucide-react";
import { ImageReveal } from "@/components/motion/image-reveal";
import { TextReveal } from "@/components/motion/text-reveal";

const details = [
  ["7", "days"],
  ["4", "boutique stays"],
  ["12", "experiences"],
  ["8", "travelers max"],
];

export function FeaturedJourney() {
  return (
    <section className="section-space page-shell" aria-labelledby="featured-heading">
      <div className="mb-14 grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="eyebrow mb-5 text-[var(--accent)]">Featured journey</p>
          <TextReveal as="h2" id="featured-heading" lines={["Seven days", "in the slower side", "of Bali."]} className="editorial-title" />
        </div>
        <p className="max-w-sm text-base leading-7 text-[var(--text-muted)] md:col-span-4">Rice terraces at first light, tables worth lingering at, and the kind of quiet that follows you home.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-12 md:gap-10">
        <ImageReveal src="/assets/journey-bali.jpg" alt="A slow, quiet moment in Bali" sizes="(max-width: 767px) 100vw, 68vw" mode="clip" className="aspect-[4/5] md:col-span-8 md:aspect-[5/4]" />
        <div className="flex flex-col justify-between border-t border-black/15 pt-6 md:col-span-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <div className="grid grid-cols-2 gap-x-5 gap-y-8">
            {details.map(([value, label]) => (
              <div key={label}>
                <strong className="font-editorial block text-5xl font-medium leading-none">{value}</strong>
                <span className="mt-2 block text-xs uppercase tracking-[0.13em] text-[var(--text-muted)]">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-16 border-t border-black/15 pt-6">
            <span className="eyebrow text-[var(--text-muted)]">From</span>
            <p className="font-editorial mt-2 text-6xl tracking-[-0.04em]">$1,240</p>
            <a href="#final-cta" className="link-arrow mt-8 border-b border-black/30 pb-3 text-sm font-bold">Discover the journey <ArrowUpRight size={17} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
