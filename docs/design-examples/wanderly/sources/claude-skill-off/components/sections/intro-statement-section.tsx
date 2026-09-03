import { LitLines } from "@/components/motion/lit-lines";

/**
 * The page draws breath. Type only, no rules, no cards — the statement
 * reads itself line by line as it crosses the middle of the screen.
 */
export function IntroStatementSection() {
  return (
    <section
      aria-label="Why we travel"
      className="wrap py-[clamp(100px,15vw,180px)]"
    >
      <div className="md:pl-[8%] lg:pl-[14%]">
        <LitLines
          as="p"
          mode="active"
          lines={[
            "Travel isn't about",
            "seeing more places.",
            "It's about feeling",
            "something new.",
          ]}
          className="display max-w-[18ch] text-[clamp(34px,7vw,92px)] leading-[1.04]"
          lineClassName="py-[0.06em]"
        />
      </div>
    </section>
  );
}
