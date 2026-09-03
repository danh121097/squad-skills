import { Container } from "@/components/ui/container";
import { BRAND, FOOTER_COLUMNS, FOOTER_LEGAL } from "@/lib/content/site";

/**
 * The masthead, at the size a magazine prints it on the back cover.
 *
 * The wordmark is set in the UI sans rather than the display serif — it is the
 * same mark as the one in the nav, just at 16vw, and switching typeface at scale
 * would make it a different logo. It is `aria-hidden` because the brand name is
 * already announced by the navigation and the copyright line; a screen reader
 * does not need to hear "Wanderly" a third time as decoration.
 */
export function SiteFooter() {
  return (
    <footer
      data-surface="inverse"
      className="overflow-hidden bg-surface-inverse pt-[clamp(4rem,10vw,8rem)] pb-10 text-on-inverse"
    >
      <Container>
        <div className="grid gap-12 border-b border-rule-inverse pb-[clamp(3rem,8vw,6rem)] sm:grid-cols-3 lg:grid-cols-12">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="lg:col-span-3">
              <h2 className="text-label uppercase text-on-inverse-muted">
                {column.title}
              </h2>
              <ul className="mt-6 flex flex-col gap-3.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="relative inline-block text-[0.9375rem] text-on-inverse/85 transition-colors duration-500 ease-editorial after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-editorial hover:text-on-inverse hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="px-5 md:px-8 lg:px-12 xl:px-20">
        <span
          aria-hidden="true"
          className="mt-[clamp(2.5rem,6vw,4.5rem)] block text-center leading-[0.78] font-semibold tracking-[-0.02em] text-[clamp(3.5rem,15.6vw,16rem)] uppercase"
        >
          {BRAND}
        </span>
      </div>

      <Container>
        <div className="mt-[clamp(2.5rem,6vw,4rem)] flex flex-col gap-4 border-t border-rule-inverse pt-8 text-label uppercase text-on-inverse-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {BRAND}</p>
          <ul className="flex items-center gap-8">
            {FOOTER_LEGAL.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="transition-colors duration-500 ease-editorial hover:text-on-inverse motion-reduce:transition-none"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
