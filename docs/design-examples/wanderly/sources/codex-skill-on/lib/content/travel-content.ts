export type Destination = {
  name: string;
  country: string;
  description: string;
  image: string;
  alt: string;
};

export const destinations: Destination[] = [
  {
    name: "Amalfi Coast",
    country: "Italy",
    description: "Sun-bleached villages, winding roads and endless Mediterranean blue.",
    image: "/assets/amalfi.jpg",
    alt: "Cliffside villages meeting the Mediterranean on the Amalfi Coast",
  },
  {
    name: "Kyoto",
    country: "Japan",
    description: "Quiet gardens, lantern-lit alleys and rituals shaped by the seasons.",
    image: "/assets/kyoto.jpg",
    alt: "A quiet, atmospheric street in Kyoto",
  },
  {
    name: "Bali",
    country: "Indonesia",
    description: "Jungle mornings, volcanic horizons and a gentler rhythm of days.",
    image: "/assets/bali.jpg",
    alt: "A lush green landscape in Bali",
  },
  {
    name: "Swiss Alps",
    country: "Switzerland",
    description: "Still lakes, high trails and villages tucked beneath impossible peaks.",
    image: "/assets/alps.jpg",
    alt: "Alpine peaks rising above a Swiss valley",
  },
];

export const experiences = [
  { number: "01", name: "Ocean", copy: "Slow mornings. Salt air. Nothing planned.", image: "/assets/exp-ocean.jpg", alt: "Open ocean and sunlit coastline" },
  { number: "02", name: "Mountains", copy: "Go where the signal disappears.", image: "/assets/exp-mountains.jpg", alt: "Remote mountain peaks at dusk" },
  { number: "03", name: "City", copy: "Culture, chaos and unforgettable nights.", image: "/assets/exp-city.jpg", alt: "A city glowing after dark" },
  { number: "04", name: "Wild", copy: "Places that still feel untouched.", image: "/assets/exp-wild.jpg", alt: "Untouched wilderness stretching to the horizon" },
] as const;

export const chapters = [
  { number: "01", title: "Wake up above the jungle.", copy: "Morning arrives slowly in Ubud. Mist lifts from the canopy as breakfast finds its way to your terrace.", image: "/assets/chapter-01.jpg", alt: "A morning view above the Balinese jungle" },
  { number: "02", title: "Swim beneath hidden waterfalls.", copy: "Follow a forest path to cool water, where the only timetable is the changing light.", image: "/assets/chapter-02.jpg", alt: "A hidden waterfall in a tropical forest" },
  { number: "03", title: "Eat where the locals eat.", copy: "A shared table, recipes passed between generations, and flavours you will try to find again at home.", image: "/assets/chapter-03.jpg", alt: "A locally prepared Balinese meal" },
  { number: "04", title: "Watch the sun disappear into the ocean.", copy: "End on the western shore with bare feet, a warm horizon and nowhere else to be.", image: "/assets/chapter-04.jpg", alt: "Sunset meeting the ocean in Bali" },
] as const;

export const articles = [
  { title: "48 hours lost in Tokyo", image: "/assets/journal-tokyo.jpg", alt: "Tokyo streets after dark", read: "8 min read" },
  { title: "The quiet side of Mallorca", image: "/assets/journal-mallorca.jpg", alt: "A quiet cove in Mallorca", read: "6 min read" },
  { title: "Why the Dolomites never feel real", image: "/assets/journal-dolomites.jpg", alt: "Dramatic peaks in the Dolomites", read: "7 min read" },
] as const;

export const testimonials = [
  { quote: "We stopped checking the itinerary after day two. Everything just felt exactly where we were supposed to be.", name: "Emma & Daniel", route: "London → Bali", avatars: ["/assets/avatar-1.jpg", "/assets/avatar-2.jpg"] },
  { quote: "There was room for wonder in every day—and enough quiet to let the place stay with us.", name: "Sofia R.", route: "Lisbon → Kyoto", avatars: ["/assets/avatar-3.jpg"] },
  { quote: "It felt less like following a plan and more like being let in on a beautiful secret.", name: "Maya & Theo", route: "Berlin → Amalfi", avatars: ["/assets/avatar-2.jpg", "/assets/avatar-3.jpg"] },
] as const;
