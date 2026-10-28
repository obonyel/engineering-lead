export type Category = "Audio" | "Wearables" | "Home" | "Travel" | "Accessories";

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number; // ZAR
  rating: number;
  stock: number;
  emoji: string;
  description: string;
  tags: string[];
}

export const CATEGORIES: Category[] = ["Audio", "Wearables", "Home", "Travel", "Accessories"];

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Dune Wireless Headphones", category: "Audio", price: 2499, rating: 4.7, stock: 14, emoji: "🎧", description: "Over-ear ANC headphones with 40h battery.", tags: ["headphones", "wireless", "anc"] },
  { id: "p2", name: "Oasis Bluetooth Speaker", category: "Audio", price: 1299, rating: 4.4, stock: 22, emoji: "🔊", description: "Waterproof portable speaker, 360° sound.", tags: ["speaker", "bluetooth", "waterproof"] },
  { id: "p3", name: "Mirage Earbuds", category: "Audio", price: 1799, rating: 4.5, stock: 30, emoji: "🎵", description: "True-wireless earbuds with wireless charging case.", tags: ["earbuds", "wireless"] },
  { id: "p4", name: "Solstice Smartwatch", category: "Wearables", price: 3999, rating: 4.6, stock: 9, emoji: "⌚", description: "AMOLED display, GPS, heart-rate and sleep tracking.", tags: ["watch", "gps", "fitness"] },
  { id: "p5", name: "Ember Fitness Band", category: "Wearables", price: 899, rating: 4.2, stock: 40, emoji: "💪", description: "Slim fitness tracker with 14-day battery.", tags: ["band", "fitness", "tracker"] },
  { id: "p6", name: "Terracotta Smart Lamp", category: "Home", price: 749, rating: 4.3, stock: 18, emoji: "💡", description: "Warm-to-cool ambient lamp with app control.", tags: ["lamp", "smart", "light"] },
  { id: "p7", name: "Sandstone Air Purifier", category: "Home", price: 3299, rating: 4.8, stock: 6, emoji: "🌬️", description: "HEPA purifier for rooms up to 40 m².", tags: ["air", "purifier", "hepa"] },
  { id: "p8", name: "Acacia Coffee Grinder", category: "Home", price: 1149, rating: 4.5, stock: 12, emoji: "☕", description: "Burr grinder with 18 grind settings.", tags: ["coffee", "kitchen"] },
  { id: "p9", name: "Nomad Carry-On Backpack", category: "Travel", price: 1899, rating: 4.6, stock: 16, emoji: "🎒", description: "35L water-resistant backpack with laptop sleeve.", tags: ["backpack", "carry-on", "laptop"] },
  { id: "p10", name: "Savanna Packing Cubes (4)", category: "Travel", price: 449, rating: 4.1, stock: 50, emoji: "🧳", description: "Compression packing cubes in 4 sizes.", tags: ["packing", "organiser"] },
  { id: "p11", name: "Meridian Power Bank 20k", category: "Accessories", price: 799, rating: 4.4, stock: 35, emoji: "🔋", description: "20,000 mAh, 65W USB-C fast charging.", tags: ["power", "charger", "usb-c"] },
  { id: "p12", name: "Kalahari Leather Wallet", category: "Accessories", price: 599, rating: 4.3, stock: 25, emoji: "👛", description: "RFID-blocking full-grain leather wallet.", tags: ["wallet", "leather"] },
];

export interface ProductFilter {
  query: string;
  category: Category | "All";
  maxPrice: number | null;
  sort: "featured" | "price-asc" | "price-desc" | "rating";
}

export const DEFAULT_FILTER: ProductFilter = { query: "", category: "All", maxPrice: null, sort: "featured" };

export function filterProducts(f: ProductFilter, list: Product[] = PRODUCTS): Product[] {
  const q = f.query.trim().toLowerCase();
  const out = list.filter((p) => {
    if (f.category !== "All" && p.category !== f.category) return false;
    if (f.maxPrice != null && p.price > f.maxPrice) return false;
    if (!q) return true;
    return [p.name, p.category, p.description, ...p.tags].some((s) => s.toLowerCase().includes(q));
  });
  if (f.sort === "price-asc") out.sort((a, b) => a.price - b.price);
  if (f.sort === "price-desc") out.sort((a, b) => b.price - a.price);
  if (f.sort === "rating") out.sort((a, b) => b.rating - a.rating);
  return out;
}

export const formatZAR = (n: number) =>
  "R" + n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/\s/g, "\u00a0");

export const findProduct = (idOrName: string): Product | undefined => {
  const s = idOrName.trim().toLowerCase();
  return (
    PRODUCTS.find((p) => p.id === s) ??
    PRODUCTS.find((p) => p.name.toLowerCase() === s) ??
    PRODUCTS.find((p) => p.name.toLowerCase().includes(s) || s.includes(p.name.toLowerCase()))
  );
};
