export type Destination = {
  readonly id: string;
  readonly index: string;
  readonly name: string;
  readonly country: string;
  readonly line: string;
  readonly season: string;
  readonly image: string;
  readonly alt: string;
};

export const destinations: readonly Destination[] = [
  {
    id: "amalfi",
    index: "01",
    name: "Amalfi Coast",
    country: "Italy",
    line: "Sun-bleached villages, winding roads and endless Mediterranean blue.",
    season: "May — September",
    image: "/assets/amalfi.jpg",
    alt: "Terraced pastel villages falling toward the Mediterranean on the Amalfi Coast",
  },
  {
    id: "kyoto",
    index: "02",
    name: "Kyoto",
    country: "Japan",
    line: "Temple bells at dawn, paper light, and streets that keep their secrets.",
    season: "March — November",
    image: "/assets/kyoto.jpg",
    alt: "A quiet Kyoto street at first light, lanterns still glowing",
  },
  {
    id: "bali",
    index: "03",
    name: "Bali",
    country: "Indonesia",
    line: "Rice terraces breathing mist, warm rain, and afternoons that refuse to end.",
    season: "April — October",
    image: "/assets/bali.jpg",
    alt: "Mist drifting across layered rice terraces in the Balinese highlands",
  },
  {
    id: "alps",
    index: "04",
    name: "Swiss Alps",
    country: "Switzerland",
    line: "Thin air, enormous silence, and mornings that arrive before anyone else.",
    season: "December — March",
    image: "/assets/alps.jpg",
    alt: "Snow-lit peaks of the Swiss Alps rising above a valley of cloud",
  },
];
