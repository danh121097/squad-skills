export type Stat = {
  value: number;
  decimals?: number;
  suffix?: string;
  label: string;
};

export type Testimonial = {
  /** Authored line breaks — the quote is set, not wrapped. */
  quote: readonly string[];
  travellers: string;
  route: string;
  avatars: readonly { src: string; alt: string }[];
};

export const STATS: readonly Stat[] = [
  { value: 42, label: "Countries" },
  { value: 128, label: "Curated journeys" },
  { value: 18, suffix: "K+", label: "Travellers" },
  { value: 4.9, decimals: 1, label: "Average rating" },
] as const;

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote: [
      "We stopped checking the itinerary",
      "after day two. Everything just felt",
      "exactly where we were supposed to be.",
    ],
    travellers: "Emma & Daniel",
    route: "London → Bali",
    avatars: [
      { src: "/assets/avatar-1.jpg", alt: "" },
      { src: "/assets/avatar-2.jpg", alt: "" },
    ],
  },
  {
    quote: [
      "Nobody handed us a schedule. They",
      "handed us a place, and someone who",
      "already loved it.",
    ],
    travellers: "Priya & Sam",
    route: "Toronto → Kyoto",
    avatars: [
      { src: "/assets/avatar-2.jpg", alt: "" },
      { src: "/assets/avatar-3.jpg", alt: "" },
    ],
  },
  {
    quote: [
      "I have been to the Alps four times.",
      "This was the first time I actually",
      "stopped and looked at them.",
    ],
    travellers: "Marta",
    route: "Lisbon → Zermatt",
    avatars: [{ src: "/assets/avatar-3.jpg", alt: "" }],
  },
] as const;
