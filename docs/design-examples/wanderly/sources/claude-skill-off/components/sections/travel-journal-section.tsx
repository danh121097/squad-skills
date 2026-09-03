import { ArrowUpRight } from "lucide-react";

import { ImageReveal } from "@/components/motion/image-reveal";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { cx } from "@/lib/cx";
import { articles, type Article } from "@/lib/content/journal";

const [lead, ...rest] = articles;

/** A magazine spread: one story given the width, two running beside it. */
export function TravelJournalSection() {
  return (
    <section id="stories" className="wrap py-[clamp(80px,11vw,140px)]">
      <header>
        <Reveal className="flex items-baseline justify-between gap-8 border-b border-ink/12 pb-5">
          <p className="eyebrow text-muted">From the journal</p>
          <a href="#stories" className="eyebrow link-underline text-muted">
            All stories
          </a>
        </Reveal>
        <TextReveal
          as="h2"
          lines={["Stories from", "somewhere else."]}
          className="display mt-10 max-w-[14ch] text-[clamp(34px,6.2vw,84px)] leading-[1.0] md:mt-14"
        />
      </header>

      <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12 md:gap-x-8">
        <JournalEntry article={lead} variant="lead" />
        {/* The tall lead and the two stacked stories are sized to finish
            at roughly the same depth, so neither column trails off. */}
        <div className="flex flex-col gap-12 md:col-span-4 md:col-start-9 md:gap-16">
          {rest.map((article) => (
            <JournalEntry key={article.id} article={article} variant="aside" />
          ))}
        </div>
      </div>
    </section>
  );
}

function JournalEntry({
  article,
  variant,
}: {
  article: Article;
  variant: "lead" | "aside";
}) {
  const isLead = variant === "lead";

  return (
    <article className={isLead ? "md:col-span-7" : undefined}>
      <a href="#stories" className="group block">
        <ImageReveal
          src={article.image}
          alt={article.alt}
          sizes={isLead ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 768px) 32vw, 100vw"}
          reveal="clip"
          parallax={isLead ? 0.4 : 0}
          hoverZoom
          cursorView
          className={cx(
            "rounded-[6px]",
            isLead ? "aspect-[5/4] md:aspect-[3/4]" : "aspect-[4/5]",
          )}
        />

        <div className="mt-6 flex items-baseline gap-4">
          <span className="eyebrow text-muted">{article.category}</span>
          <span aria-hidden="true" className="h-px w-6 bg-ink/20" />
          <span className="eyebrow text-muted">{article.readingTime}</span>
        </div>

        <h3
          className={cx(
            "display mt-4 leading-[1.06]",
            isLead
              ? "text-[clamp(28px,3.8vw,50px)]"
              : "max-w-[20ch] text-[clamp(24px,2.4vw,32px)]",
          )}
        >
          {article.title}
        </h3>

        <p
          className={cx(
            "mt-4 text-[15px] leading-[1.6] text-muted",
            isLead ? "max-w-[52ch] md:text-[17px]" : "max-w-[38ch]",
          )}
        >
          {article.standfirst}
        </p>

        <span className="mt-6 inline-flex items-center gap-2 text-[13px]">
          Read the story
          <ArrowUpRight
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1 group-hover:-translate-y-0.5"
          />
        </span>
      </a>
    </article>
  );
}
