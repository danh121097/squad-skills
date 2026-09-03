import { LitLines } from "@/components/motion/lit-lines";

/** Nothing here but the sentence. No CTA, no chrome, ~100px of air. */
export function ManifestoSection() {
  return (
    <section
      aria-label="Manifesto"
      className="flex min-h-[92svh] items-center justify-center px-5 py-[100px] md:px-8"
    >
      <LitLines
        as="p"
        mode="cumulative"
        lines={["The best trips", "aren't measured", "in miles."]}
        className="display text-center text-[clamp(40px,9vw,124px)] leading-[1.02]"
      />
    </section>
  );
}
