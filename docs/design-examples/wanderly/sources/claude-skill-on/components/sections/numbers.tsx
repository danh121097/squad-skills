import { CountUp } from "@/components/motion/count-up";
import { Container } from "@/components/ui/container";
import { STATS } from "@/lib/content/proof";

/**
 * Four figures set as an index page: full-width rows divided by hairlines, the
 * numeral ranged left at display size and the label ranged right in 11px caps.
 *
 * Rows rather than a four-column strip is what keeps this from reading as a
 * stats bar bolted onto a marketing page — and it is also the only arrangement
 * that honours "horizontal separators only". No boxes, no icons, no accent
 * colour: the size difference between 120px and 11px is the entire design.
 */
export function Numbers() {
  return (
    <section
      aria-labelledby="numbers-heading"
      className="py-[clamp(4rem,10vw,8rem)]"
    >
      <Container>
        <h2 id="numbers-heading" className="sr-only">
          Wanderly in numbers
        </h2>

        <dl className="border-t border-rule">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex items-baseline justify-between gap-8 border-b border-rule py-[clamp(1.5rem,3vw,2.75rem)]"
            >
              {/* Term before description in the DOM, as a definition list
                  requires; `order` only swaps them visually so the numeral can
                  range left. No focusable content here, so the visual reorder
                  cannot desynchronise the tab sequence. */}
              <dt className="order-2 text-label uppercase text-secondary">
                {stat.label}
              </dt>
              <dd className="order-1 m-0 font-display text-numeral tabular-nums">
                <CountUp
                  value={stat.value}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
