export type NavLink = {
  readonly label: string;
  readonly href: string;
};

export type FooterColumn = {
  readonly heading: string;
  readonly links: readonly NavLink[];
};

export const navLinks: readonly NavLink[] = [
  { label: "Destinations", href: "#destinations" },
  { label: "Journeys", href: "#journeys" },
  { label: "Stories", href: "#stories" },
  { label: "About", href: "#about" },
];

export const footerColumns: readonly FooterColumn[] = [
  {
    heading: "Explore",
    links: [
      { label: "Destinations", href: "#destinations" },
      { label: "Journeys", href: "#journeys" },
      { label: "Journal", href: "#stories" },
      { label: "Travel Guides", href: "#stories" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#about" },
      { label: "Contact", href: "#about" },
    ],
  },
  {
    heading: "Social",
    links: [
      { label: "Instagram", href: "#about" },
      { label: "YouTube", href: "#about" },
      { label: "Pinterest", href: "#about" },
    ],
  },
];

export const legalLinks: readonly NavLink[] = [
  { label: "Privacy", href: "#about" },
  { label: "Terms", href: "#about" },
];
