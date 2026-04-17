import inventoryData from "@/data/inventory.json";
import { gearItemSchema, type GearItem, type CategoryId } from "@/lib/validation";

let cache: { items: GearItem[]; expiresAt: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

function loadAll(): GearItem[] {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.items;
  const parsed = gearItemSchema.array().parse(inventoryData);
  cache = { items: parsed, expiresAt: now + TTL_MS };
  return parsed;
}

export function getAllGear(): GearItem[] {
  return loadAll();
}

export function getGearById(id: string): GearItem | null {
  return loadAll().find((i) => i.id === id) ?? null;
}

export function getGearByCategory(category: CategoryId): GearItem[] {
  return loadAll().filter((i) => i.category === category);
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getRandomGear(count: number): GearItem[] {
  return shuffle(loadAll()).slice(0, count);
}

export function searchGear(category: CategoryId, query: string): GearItem[] {
  const q = query.trim().toLowerCase();
  const byCat = getGearByCategory(category);
  if (!q) return byCat;
  return byCat.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
  );
}
