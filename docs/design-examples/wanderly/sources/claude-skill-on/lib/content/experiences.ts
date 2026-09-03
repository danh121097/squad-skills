export type Experience = {
  index: string;
  title: string;
  line: string;
  image: { src: string; alt: string };
};

export const EXPERIENCES_INTRO = {
  heading: ["Choose your kind", "of escape."],
} as const;

export const EXPERIENCES: readonly Experience[] = [
  {
    index: "01",
    title: "Ocean",
    line: "Slow mornings. Salt air. Nothing planned.",
    image: {
      src: "/assets/exp-ocean.jpg",
      alt: "Open water meeting a pale empty shoreline.",
    },
  },
  {
    index: "02",
    title: "Mountains",
    line: "Go where the signal disappears.",
    image: {
      src: "/assets/exp-mountains.jpg",
      alt: "A high ridgeline under thin cloud.",
    },
  },
  {
    index: "03",
    title: "City",
    line: "Culture, chaos and unforgettable nights.",
    image: {
      src: "/assets/exp-city.jpg",
      alt: "A dense city skyline after dark.",
    },
  },
  {
    index: "04",
    title: "Wild",
    line: "Places that still feel untouched.",
    image: {
      src: "/assets/exp-wild.jpg",
      alt: "Open wilderness running to a distant horizon.",
    },
  },
] as const;
