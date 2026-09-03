export type Stat = {
  readonly id: string;
  readonly value: number;
  readonly decimals: number;
  readonly suffix: string;
  readonly label: string;
  readonly note: string;
};

export const stats: readonly Stat[] = [
  {
    id: "countries",
    value: 42,
    decimals: 0,
    suffix: "",
    label: "Countries",
    note: "Six continents, one very long list",
  },
  {
    id: "journeys",
    value: 128,
    decimals: 0,
    suffix: "",
    label: "Curated journeys",
    note: "Each one walked before it was sold",
  },
  {
    id: "travellers",
    value: 18,
    decimals: 0,
    suffix: "K+",
    label: "Travellers",
    note: "Since the first trip, in 2016",
  },
  {
    id: "rating",
    value: 4.9,
    decimals: 1,
    suffix: "",
    label: "Average rating",
    note: "Across 6,400 verified reviews",
  },
];
