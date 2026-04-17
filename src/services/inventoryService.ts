import rawInventory from "@/data/inventory.json";
import { gearItemSchema, GearItem, Category } from "@/lib/validation";
import { z } from "zod";

// ─── In-memory cache ─────────────────────────────────────────────────────────

interface CacheEntry {
  data: GearItem[];
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let _cache: CacheEntry | null = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new shuffled array. */
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Validates and returns all inventory items. Caches for TTL. */
function loadInventory(): GearItem[] {
  if (_cache && Date.now() < _cache.expiresAt) {
    return _cache.data;
  }

  const parsed = z.array(gearItemSchema).safeParse(rawInventory);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((e) => `  • [${e.path.map(String).join(".")}] ${e.message}`)
      .join("\n");
    throw new Error(`[inventoryService] Invalid inventory data:\n${issues}`);
  }

  _cache = { data: parsed.data, expiresAt: Date.now() + CACHE_TTL_MS };
  return parsed.data;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns all gear items. */
export function getAllGear(): GearItem[] {
  return loadInventory();
}

/** Returns items filtered by category. */
export function getGearByCategory(category: Category): GearItem[] {
  return loadInventory().filter((item) => item.category === category);
}

/** Finds a single item by ID. Returns undefined if not found. */
export function getGearById(id: string): GearItem | undefined {
  return loadInventory().find((item) => item.id === id);
}

/** Returns `count` random items using Fisher-Yates. */
export function getRandomGear(count: number): GearItem[] {
  const all = loadInventory();
  return shuffleArray(all).slice(0, Math.min(count, all.length));
}

/** Returns items matching a case-insensitive search term. */
export function searchGear(query: string, category?: Category): GearItem[] {
  const lower = query.toLowerCase();
  const pool = category ? getGearByCategory(category) : loadInventory();
  return pool.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower)
  );
}

/** Resets the cache — useful in tests. */
export function resetCache(): void {
  _cache = null;
}
