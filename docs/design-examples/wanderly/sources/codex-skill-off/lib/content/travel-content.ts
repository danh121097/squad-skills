export type Destination = {
  name: string;
  country: string;
  description: string;
  image: string;
};

export type Experience = {
  number: string;
  title: string;
  description: string;
  image: string;
};

export type Chapter = {
  number: string;
  title: string;
  description: string;
  image: string;
};

export const destinations: Destination[] = [
  {
    name: "Amalfi Coast",
    country: "Italy",
    description: "Sun-bleached villages, winding roads and endless Mediterranean blue.",
    image: "/assets/amalfi.jpg",
  },
  {
    name: "Kyoto",
    country: "Japan",
    description: "Temple mornings, quiet gardens and lantern-lit streets after rain.",
    image: "/assets/kyoto.jpg",
  },
  {
    name: "Bali",
    country: "Indonesia",
    description: "Jungle paths, warm water and days that move at their own pace.",
    image: "/assets/bali.jpg",
  },
  {
    name: "Swiss Alps",
    country: "Switzerland",
    description: "High trails, cold lakes and silence stretched between the peaks.",
    image: "/assets/alps.jpg",
  },
];

export const experiences: Experience[] = [
  { number: "01", title: "Ocean", description: "Slow mornings. Salt air. Nothing planned.", image: "/assets/exp-ocean.jpg" },
  { number: "02", title: "Mountains", description: "Go where the signal disappears.", image: "/assets/exp-mountains.jpg" },
  { number: "03", title: "City", description: "Culture, chaos and unforgettable nights.", image: "/assets/exp-city.jpg" },
  { number: "04", title: "Wild", description: "Places that still feel untouched.", image: "/assets/exp-wild.jpg" },
];

export const chapters: Chapter[] = [
  { number: "01", title: "Wake up above the jungle.", description: "Morning arrives as mist lifts from the palms below your room.", image: "/assets/chapter-01.jpg" },
  { number: "02", title: "Swim beneath hidden waterfalls.", description: "Follow a forest trail to water clear enough to stop time.", image: "/assets/chapter-02.jpg" },
  { number: "03", title: "Eat where the locals eat.", description: "A family table, a charcoal fire and recipes shared by memory.", image: "/assets/chapter-03.jpg" },
  { number: "04", title: "Watch the sun disappear into the ocean.", description: "End the week barefoot, with nowhere else you need to be.", image: "/assets/chapter-04.jpg" },
];

export const testimonials = [
  {
    quote: "We stopped checking the itinerary after day two. Everything just felt exactly where we were supposed to be.",
    names: "Emma & Daniel",
    route: "London to Bali",
  },
  {
    quote: "Every place felt personal, never performed. We came home with stories we could not have planned.",
    names: "Noor & Elias",
    route: "Amsterdam to Kyoto",
  },
  {
    quote: "There was room to wander, change our minds and stay longer. That freedom made the whole journey ours.",
    names: "Maya & Clara",
    route: "Berlin to Amalfi",
  },
] as const;
