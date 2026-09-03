export type Testimonial = {
  readonly id: string;
  readonly quoteLines: readonly string[];
  readonly names: string;
  readonly route: string;
  readonly avatars: readonly string[];
  readonly avatarAlt: string;
};

export const testimonials: readonly Testimonial[] = [
  {
    id: "emma-daniel",
    quoteLines: [
      "We stopped checking the itinerary",
      "after day two. Everything just felt",
      "exactly where we were supposed to be.",
    ],
    names: "Emma & Daniel",
    route: "London → Bali",
    avatars: ["/assets/avatar-1.jpg", "/assets/avatar-2.jpg"],
    avatarAlt: "Emma and Daniel",
  },
  {
    id: "sofia",
    quoteLines: [
      "Nobody handed us a schedule. They",
      "handed us a village, a kitchen, and",
      "the afternoon to work out the rest.",
    ],
    names: "Sofia Marchetti",
    route: "Milan → Kyoto",
    avatars: ["/assets/avatar-3.jpg"],
    avatarAlt: "Sofia Marchetti",
  },
  {
    id: "the-arnesons",
    quoteLines: [
      "Nine days without once wondering",
      "what we should be doing instead.",
      "I have never travelled that quietly.",
    ],
    names: "The Arnesons",
    route: "Oslo → Amalfi",
    avatars: ["/assets/avatar-2.jpg", "/assets/avatar-1.jpg", "/assets/avatar-3.jpg"],
    avatarAlt: "The Arneson family",
  },
];
