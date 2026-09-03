import { ArrowRight } from "lucide-react";

import { ImageReveal } from "@/components/motion/image-reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { JOURNAL, JOURNAL_INTRO } from "@/lib/content/journal";
import type { JournalEntry } from "@/lib/content/journal";

/**
 * Three stories at three different weights, the way a contents page ranks them:
 * the lead takes ~58% of the width in landscape, the other two run portrait down
 * a narrower column that starts lower than the lead.
 *
 * Each article uses a stretched link — the anchor covers the whole article via a
 * pseudo-element — so the hit target is the entire block while the accessible
 * name stays just the headline, and there is exactly one tab stop per story
 * rather than an image link and a title link saying the same thing twice.
 */
function JournalArticle({
  entry,
  variant,
}: {
  entry: JournalEntry;
  variant: "lead" | "secondary";
}) {
  const isLead = variant === "lead";

  return (
    <article className="group relative">
      <ImageReveal
        src={entry.image.src}
        alt={entry.image.alt}
        sizes={
          isLead ? "(min-width: 1024px) 56vw, 100vw" : "(min-width: 1024px) 30vw, 100vw"
        }
        reveal="scale"
        hoverZoom
        cursorLabel
        className={`rounded-[6px] ${isLead ? "aspect-[3/2]" : "aspect-[4/5]"}`}
      />

      <div className="mt-6 flex items-baseline gap-3 text-label uppercase text-secondary">
        <span>{entry.kicker}</span>
        <span aria-hidden="true">·</span>
        <span>{entry.readingTime}</span>
      </div>

      <h3
        className={`mt-4 font-display leading-[1.05] ${
          isLead
            ? "max-w-[16ch] text-[clamp(2rem,3.6vw,3.25rem)]"
            : "max-w-[18ch] text-[clamp(1.5rem,2.1vw,2rem)]"
        }`}
      >
        <a
          href={entry.href}
          className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-offset-8"
        >
          {entry.title}
        </a>
      </h3>

      <span
        aria-hidden="true"
        className="mt-5 inline-flex items-center gap-2 text-label uppercase text-secondary"
      >
        Read story
        <ArrowRight
          strokeWidth={1.5}
          className="size-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1 motion-reduce:transition-none"
        />
      </span>
    </article>
  );
}

export function Journal() {
  const [lead, ...rest] = JOURNAL;

  return (
    <section
      id="stories"
      aria-labelledby="journal-heading"
      className="py-[clamp(5rem,12vw,10rem)]"
    >
      <Container>
        <div className="mb-[clamp(3rem,7vw,6rem)] flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>{JOURNAL_INTRO.eyebrow}</Eyebrow>
            <TextReveal
              as="h2"
              id="journal-heading"
              lines={JOURNAL_INTRO.heading}
              className="mt-8 font-display text-section"
            />
          </div>
        </div>

        <div className="grid gap-14 lg:grid-cols-12 lg:gap-x-12">
          {lead ? (
            <div className="lg:col-span-7">
              <JournalArticle entry={lead} variant="lead" />
            </div>
          ) : null}

          <div className="grid gap-12 lg:col-span-4 lg:col-start-9 lg:mt-28">
            {rest.map((entry) => (
              <JournalArticle
                key={entry.title}
                entry={entry}
                variant="secondary"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
