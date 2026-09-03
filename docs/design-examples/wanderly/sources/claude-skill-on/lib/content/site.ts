export type NavLink = {
  label: string;
  href: string;
};

export const BRAND = "Wanderly" as const;

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Destinations", href: "#destinations" },
  { label: "Journeys", href: "#journeys" },
  { label: "Stories", href: "#stories" },
  { label: "About", href: "#about" },
] as const;

export const HERO = {
  eyebrow: "Curated journeys around the world",
  /** Authored line breaks: the headline is typeset, not reflowed. */
  headline: ["Go somewhere", "you'll remember."],
  support:
    "Thoughtfully curated journeys, extraordinary places, and stories worth bringing home.",
  cta: { label: "Explore journeys", href: "#journeys" },
  image: {
    src: "/assets/hero-coastline.jpg",
    alt: "A Mediterranean coastline at dusk, pale cliffs falling into open water.",
  },
} as const;

export const INTRO_STATEMENT = [
  "Travel isn't about",
  "seeing more places.",
  "It's about feeling",
  "something new.",
] as const;

export const MANIFESTO = {
  lines: ["The best trips", "aren't measured", "in miles."],
  /** Index of the line set in italic — the turn of the sentence, not decoration. */
  italicLine: 1,
} as const;

export const SOMEWHERE_NEXT = {
  eyebrow: "Somewhere next",
  headline: ["Where will", "you disappear to?"],
  image: {
    src: "/assets/somewhere-next.jpg",
    alt: "A mountain range disappearing into low cloud at first light.",
  },
} as const;

export const FINAL_CTA = {
  headline: ["The world", "is waiting."],
  support: "Find a journey worth remembering.",
  primary: { label: "Explore journeys", href: "#journeys" },
  secondary: { label: "Talk to a travel designer", href: "#about" },
} as const;

export const FOOTER_COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Destinations", href: "#destinations" },
      { label: "Journeys", href: "#journeys" },
      { label: "Journal", href: "#stories" },
      { label: "Travel Guides", href: "#stories" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#about" },
      { label: "Contact", href: "#about" },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "Instagram", href: "#about" },
      { label: "YouTube", href: "#about" },
      { label: "Pinterest", href: "#about" },
    ],
  },
] as const;

export const FOOTER_LEGAL = [
  { label: "Privacy", href: "#about" },
  { label: "Terms", href: "#about" },
] as const;
