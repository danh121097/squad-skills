export type JournalEntry = {
  title: string;
  kicker: string;
  readingTime: string;
  href: string;
  image: { src: string; alt: string };
};

export const JOURNAL_INTRO = {
  eyebrow: "From the journal",
  heading: ["Stories from", "somewhere else."],
} as const;

export const JOURNAL: readonly JournalEntry[] = [
  {
    title: "48 hours lost in Tokyo",
    kicker: "Journal",
    readingTime: "8 min read",
    href: "#stories",
    image: {
      src: "/assets/journal-tokyo.jpg",
      alt: "A Tokyo side street lit by shop signs after rain.",
    },
  },
  {
    title: "The quiet side of Mallorca",
    kicker: "Journal",
    readingTime: "6 min read",
    href: "#stories",
    image: {
      src: "/assets/journal-mallorca.jpg",
      alt: "A stone terrace above the sea on Mallorca's north coast.",
    },
  },
  {
    title: "Why the Dolomites never feel real",
    kicker: "Journal",
    readingTime: "5 min read",
    href: "#stories",
    image: {
      src: "/assets/journal-dolomites.jpg",
      alt: "Sheer Dolomite peaks catching the last of the evening light.",
    },
  },
] as const;
