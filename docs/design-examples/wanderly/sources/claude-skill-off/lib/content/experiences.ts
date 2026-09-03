export type Experience = {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly line: string;
  readonly image: string;
  readonly alt: string;
};

export const experiences: readonly Experience[] = [
  {
    id: "ocean",
    index: "01",
    title: "Ocean",
    line: "Slow mornings. Salt air. Nothing planned.",
    image: "/assets/exp-ocean.jpg",
    alt: "Open ocean water catching low, late light",
  },
  {
    id: "mountains",
    index: "02",
    title: "Mountains",
    line: "Go where the signal disappears.",
    image: "/assets/exp-mountains.jpg",
    alt: "A ridgeline of bare mountains under a wide, empty sky",
  },
  {
    id: "city",
    index: "03",
    title: "City",
    line: "Culture, chaos and unforgettable nights.",
    image: "/assets/exp-city.jpg",
    alt: "A dense city after dark, windows and signage burning",
  },
  {
    id: "wild",
    index: "04",
    title: "Wild",
    line: "Places that still feel untouched.",
    image: "/assets/exp-wild.jpg",
    alt: "Untracked wilderness stretching to a distant horizon",
  },
];
