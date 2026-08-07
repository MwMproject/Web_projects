export type HeatLevel = "spicy" | "hot" | "extreme";
export type ProductStatus = "available" | "coming_soon";

export interface Product {
  id: string;
  number: string;
  name: string;
  flavor: string;
  description: string[];
  heatLevel: HeatLevel;
  heatScore: 3 | 4 | 5;
  volume?: number;
  price?: number;
  status: ProductStatus;
  profile: string;
  pairings?: string[];
}

export const products: Product[] = [
  { id: "pulse", number: "01", name: "PULSE", flavor: "Framboise × Fraise", description: ["Une attaque fruitée et acidulée.", "Une chaleur nette qui laisse le goût mener."], heatLevel: "spicy", heatScore: 3, volume: 100, price: 14.9, status: "available", profile: "Fruitée · Acidulée · Gourmande", pairings: ["Burger", "Wings", "Fromage", "BBQ"] },
  { id: "rush", number: "02", name: "RUSH", flavor: "Passion × Menthe", description: ["Le fruit de la passion ouvre la voie.", "La menthe étire une chaleur vive et fraîche."], heatLevel: "hot", heatScore: 4, volume: 100, price: 16.9, status: "available", profile: "Exotique · Vive · Fraîche", pairings: ["Tacos", "Poisson", "Poulet", "Salades"] },
  { id: "void", number: "03", name: "VOID", flavor: "Mûre × Ail noir", description: ["Sombre, profonde, presque magnétique.", "L’umami précède une chaleur sans détour."], heatLevel: "extreme", heatScore: 5, volume: 100, price: 18.9, status: "available", profile: "Profonde · Umami · Brutale", pairings: ["Viandes", "Ramen", "Pizza", "Marinades"] },
];

export const comingSoon = [
  { name: "GLOW", flavor: "Pêche × Citron", level: "Piquante" },
  { name: "BLOOM", flavor: "Myrtille × Basilic", level: "Piquante" },
  { name: "FLARE", flavor: "Mangue × Gingembre", level: "Forte" },
  { name: "VOLT", flavor: "Ananas × Citron vert", level: "Forte" },
  { name: "ECLIPSE", flavor: "Cerise noire × Chipotle", level: "Extrême" },
  { name: "CORE", flavor: "Ananas rôti × Piment fumé", level: "Extrême" },
];

export const levelLabels: Record<HeatLevel, string> = { spicy: "Piquante", hot: "Forte", extreme: "Extrême" };
