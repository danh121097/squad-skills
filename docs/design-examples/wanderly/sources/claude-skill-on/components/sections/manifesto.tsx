import { TextReveal } from "@/components/motion/text-reveal";
import { Container } from "@/components/ui/container";
import { MANIFESTO } from "@/lib/content/site";

/**
 * The second text-only moment, and deliberately not a repeat of the first.
 *
 * Where the intro statement is left-ranged, indented and scrubbed line by line,
 * this one is centred, framed by hairlines, masked rather than dimmed, and sets
 * its middle line in italic — the turn of the sentence carried by the typeface
 * instead of by a colour or a size change. Two text sections, two different
 * pieces of typography.
 */
export function Manifesto() {
  return (
    <section
      id="about"
      aria-labelledby="manifesto"
      className="flex min-h-[100svh] items-center py-[clamp(6rem,14vw,11rem)]"
    >
      <Container className="flex flex-col items-center">
        <span aria-hidden="true" className="h-16 w-px bg-rule lg:h-24" />

        <TextReveal
          as="h2"
          id="manifesto"
          lines={MANIFESTO.lines}
          duration={1.1}
          stagger={0.12}
          start="top 78%"
          className="my-[clamp(3rem,7vw,6.25rem)] text-center font-display text-statement"
          lineClassName={MANIFESTO.lines.map((_, index) =>
            index === MANIFESTO.italicLine ? "italic" : "",
          )}
        />

        <span aria-hidden="true" className="h-16 w-px bg-rule lg:h-24" />
      </Container>
    </section>
  );
}
