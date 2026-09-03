export type JourneyDetail = {
  label: string;
  value: string;
};

export type Chapter = {
  index: string;
  headline: string;
  description: string;
  image: { src: string; alt: string };
};

export const FEATURED_JOURNEY = {
  eyebrow: "Featured journey",
  title: ["Seven days", "in the slower side", "of Bali."],
  description:
    "A week that moves at the pace of the island: jungle mornings, long lunches with the families who cook them, and evenings that end in the water.",
  details: [
    { label: "Duration", value: "7 days" },
    { label: "Stays", value: "4 boutique" },
    { label: "Experiences", value: "12 curated" },
    { label: "Group size", value: "Max 8 travellers" },
  ] satisfies readonly JourneyDetail[],
  price: { prefix: "From", value: "$1,240" },
  cta: { label: "Discover the journey", href: "#journeys" },
  image: {
    src: "/assets/journey-bali.jpg",
    alt: "Palms leaning over a still pool in the Balinese interior.",
  },
} as const;

export const CHAPTERS_INTRO = {
  eyebrow: "The itinerary",
  heading: ["Seven days,", "four chapters."],
} as const;

export const CHAPTERS: readonly Chapter[] = [
  {
    index: "01",
    headline: "Wake up above the jungle.",
    description:
      "The valley fills with mist before sunrise and empties again by breakfast. Nothing is scheduled before nine.",
    image: {
      src: "/assets/chapter-01.jpg",
      alt: "Mist lifting off a forested valley at sunrise.",
    },
  },
  {
    index: "02",
    headline: "Swim beneath hidden waterfalls.",
    description:
      "A short walk down through the trees, then cold, clear water and no one else for an hour.",
    image: {
      src: "/assets/chapter-02.jpg",
      alt: "A waterfall falling into a shaded green pool.",
    },
  },
  {
    index: "03",
    headline: "Eat where the locals eat.",
    description:
      "Warungs with four tables and one thing on the menu, chosen by the people who have eaten there their whole lives.",
    image: {
      src: "/assets/chapter-03.jpg",
      alt: "A small open-fronted local eating house at night.",
    },
  },
  {
    index: "04",
    headline: "Watch the sun disappear into the ocean.",
    description:
      "The last hour of light on the west coast, when the water turns the colour of the sky and everyone stops talking.",
    image: {
      src: "/assets/chapter-04.jpg",
      alt: "The sun setting into the sea off a western shore.",
    },
  },
] as const;
