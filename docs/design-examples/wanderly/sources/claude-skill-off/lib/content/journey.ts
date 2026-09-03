export type JourneyDetail = {
  readonly value: string;
  readonly label: string;
};

export type Chapter = {
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly alt: string;
};

export const featuredJourney = {
  eyebrow: "Featured journey",
  titleLines: ["Seven days", "in the slower side", "of Bali."] as const,
  standfirst:
    "A week paced to the island rather than the itinerary — highland mornings, long lunches with the families who cook them, and four stays chosen for the view from the bed.",
  image: "/assets/journey-bali.jpg",
  alt: "A boutique stay opening onto the Balinese jungle at first light",
  details: [
    { value: "7", label: "Days" },
    { value: "4", label: "Boutique stays" },
    { value: "12", label: "Experiences" },
    { value: "8", label: "Travellers max" },
  ] satisfies readonly JourneyDetail[],
  price: "From $1,240",
  priceNote: "per traveller, flights excluded",
  cta: "Discover the journey",
} as const;

export const chapters: readonly Chapter[] = [
  {
    index: "01",
    title: "Wake up above the jungle.",
    description:
      "The valley holds its mist until seven. You take breakfast on the deck while it burns off, and the day starts without ever being announced.",
    image: "/assets/chapter-01.jpg",
    alt: "Morning mist lifting off a jungle valley seen from a raised deck",
  },
  {
    index: "02",
    title: "Swim beneath hidden waterfalls.",
    description:
      "A short walk down through the trees, then cold, clear water and the noise of it — the only appointment in the entire afternoon.",
    image: "/assets/chapter-02.jpg",
    alt: "A waterfall falling into a clear pool inside dense forest",
  },
  {
    index: "03",
    title: "Eat where the locals eat.",
    description:
      "No reservations, no English menu. A family kitchen, plastic stools, and the best meal of the week for the price of a coffee at home.",
    image: "/assets/chapter-03.jpg",
    alt: "A small family kitchen preparing food for a handful of guests",
  },
  {
    index: "04",
    title: "Watch the sun disappear into the ocean.",
    description:
      "Everyone stops. The light goes gold, then pink, then nothing at all — and for twenty minutes nobody reaches for a phone.",
    image: "/assets/chapter-04.jpg",
    alt: "The sun dropping into the ocean at the end of the day",
  },
];
