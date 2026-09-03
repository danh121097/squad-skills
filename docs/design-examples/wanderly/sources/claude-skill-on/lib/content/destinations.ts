export type Destination = {
  name: string;
  country: string;
  /** One sentence. The section lives or dies on these being written, not filled. */
  line: string;
  href: string;
  image: { src: string; alt: string };
};

export const DESTINATIONS_INTRO = {
  eyebrow: "Places worth getting lost in",
  heading: ["Not just destinations.", "Stories waiting to happen."],
} as const;

export const DESTINATIONS: readonly Destination[] = [
  {
    name: "Amalfi Coast",
    country: "Italy",
    line: "Sun-bleached villages, winding roads and endless Mediterranean blue.",
    href: "#journeys",
    image: {
      src: "/assets/amalfi.jpg",
      alt: "Pastel houses stacked above a harbour on the Amalfi Coast.",
    },
  },
  {
    name: "Kyoto",
    country: "Japan",
    line: "Temple bells at dawn, and a city that keeps its oldest habits.",
    href: "#journeys",
    image: {
      src: "/assets/kyoto.jpg",
      alt: "A quiet Kyoto lane between timber machiya houses.",
    },
  },
  {
    name: "Bali",
    country: "Indonesia",
    line: "Terraced green, warm rain, and mornings that start before the heat.",
    href: "#journeys",
    image: {
      src: "/assets/bali.jpg",
      alt: "Rice terraces stepping down a Balinese hillside in soft light.",
    },
  },
  {
    name: "Swiss Alps",
    country: "Switzerland",
    line: "Thin air, long silences, and light that arrives late and leaves slowly.",
    href: "#journeys",
    image: {
      src: "/assets/alps.jpg",
      alt: "Snow-covered Alpine peaks above a valley of low cloud.",
    },
  },
] as const;
