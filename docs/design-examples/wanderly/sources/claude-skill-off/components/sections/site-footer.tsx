import { Reveal } from "@/components/motion/reveal";
import { footerColumns, legalLinks } from "@/lib/content/site";

/** Explore / Company / Social sit in the right half of the twelve. */
const columnStart = ["md:col-start-7", "md:col-start-9", "md:col-start-11"] as const;

/** The wordmark, at the size the brand deserves at the end of a story. */
export function SiteFooter() {
  return (
    <footer className="bg-forest text-canvas">
      <div className="wrap pb-10 pt-[clamp(64px,9vw,120px)]">
        <div className="grid gap-12 border-t border-canvas/10 pt-14 md:grid-cols-12 md:gap-x-8">
          <Reveal className="md:col-span-4">
            <p className="max-w-[30ch] text-[16px] leading-[1.6] text-canvas/55">
              Wanderly designs a small number of journeys each year, and walks every
              one of them first.
            </p>
          </Reveal>

          {footerColumns.map((column, columnIndex) => (
            <nav
              key={column.heading}
              aria-label={column.heading}
              className={`md:col-span-2 ${columnStart[columnIndex]}`}
            >
              <Reveal delay={0.05 * (columnIndex + 1)}>
                <p className="eyebrow text-canvas/40">{column.heading}</p>
                <ul className="mt-6 flex flex-col gap-3.5">
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}`}>
                      <a
                        href={link.href}
                        className="link-underline text-[15px] text-canvas/85 transition-colors duration-500 ease-editorial hover:text-canvas"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </nav>
          ))}
        </div>

        <div aria-hidden="true" className="mt-[clamp(64px,10vw,140px)] overflow-hidden">
          <span className="block whitespace-nowrap text-center text-[17.2vw] font-medium uppercase leading-[0.8] tracking-[-0.035em]">
            Wanderly
          </span>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-canvas/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-canvas/45">© 2026 Wanderly</p>
          <ul className="flex items-center gap-7">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="link-underline text-[13px] text-canvas/45 transition-colors duration-500 ease-editorial hover:text-canvas/80"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
