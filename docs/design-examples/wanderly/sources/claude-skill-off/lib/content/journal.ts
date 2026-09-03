export type Article = {
  readonly id: string;
  readonly title: string;
  readonly standfirst: string;
  readonly category: string;
  readonly readingTime: string;
  readonly image: string;
  readonly alt: string;
};

export const articles: readonly Article[] = [
  {
    id: "tokyo",
    title: "48 hours lost in Tokyo",
    standfirst:
      "Two days without a plan, a translation app running out of battery, and the small, specific joy of ordering the wrong thing.",
    category: "Journal",
    readingTime: "8 min read",
    image: "/assets/journal-tokyo.jpg",
    alt: "A Tokyo backstreet lit by signage and rain",
  },
  {
    id: "mallorca",
    title: "The quiet side of Mallorca",
    standfirst:
      "Past the marinas, the island turns to stone terraces and olive light.",
    category: "Journal",
    readingTime: "6 min read",
    image: "/assets/journal-mallorca.jpg",
    alt: "A stone terrace above the sea on the quiet side of Mallorca",
  },
  {
    id: "dolomites",
    title: "Why the Dolomites never feel real",
    standfirst: "Limestone towers, alpenglow, and a sense of scale you cannot photograph.",
    category: "Journal",
    readingTime: "8 min read",
    image: "/assets/journal-dolomites.jpg",
    alt: "Limestone spires of the Dolomites catching alpenglow",
  },
];
