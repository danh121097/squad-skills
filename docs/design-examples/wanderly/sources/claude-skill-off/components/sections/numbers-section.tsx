import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { stats } from "@/lib/content/stats";

/**
 * Figures set as type. No cards, no boxes — hairlines and air.
 *
 * Laid out with flex and `order` rather than grid columns: the numeral
 * has to read first while the markup keeps term before definition, and
 * grid's sparse auto-placement refuses to walk backwards across a row.
 */
export function NumbersSection() {
  return (
    <section aria-label="Wanderly in numbers" className="wrap py-[clamp(80px,11vw,140px)]">
      <dl className="border-t border-ink/12">
        {stats.map((stat) => (
          <Reveal
            key={stat.id}
            as="div"
            duration={1}
            className="flex flex-col border-b border-ink/12 py-8 md:flex-row md:items-baseline md:gap-8 md:py-11"
          >
            <dt className="eyebrow order-2 mt-4 text-ink md:mt-0 md:w-[26%]">
              {stat.label}
            </dt>
            <dd className="display order-1 text-[clamp(52px,9vw,120px)] leading-[0.85] md:w-[34%]">
              <CountUp
                value={stat.value}
                decimals={stat.decimals}
                suffix={stat.suffix}
              />
            </dd>
            <dd className="order-3 mt-3 text-[14px] text-muted md:mt-0 md:ml-auto md:max-w-[30ch] md:text-right">
              {stat.note}
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
