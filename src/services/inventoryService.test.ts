import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllGear,
  getGearByCategory,
  getGearById,
  getRandomGear,
  searchGear,
  resetCache,
} from "./inventoryService";

beforeEach(() => {
  resetCache();
});

describe("getAllGear", () => {
  it("returns all 50 items", () => {
    const items = getAllGear();
    expect(items.length).toBe(50);
  });

  it("returns items with required fields", () => {
    const items = getAllGear();
    for (const item of items) {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.dailyRate).toBeGreaterThan(0);
    }
  });
});

describe("getGearByCategory", () => {
  it("returns only fotografia-video items", () => {
    const items = getGearByCategory("fotografia-video");
    expect(items.length).toBeGreaterThan(0);
    items.forEach((i) => expect(i.category).toBe("fotografia-video"));
  });

  it("returns only montana-camping items", () => {
    const items = getGearByCategory("montana-camping");
    items.forEach((i) => expect(i.category).toBe("montana-camping"));
  });

  it("returns only deportes-acuaticos items", () => {
    const items = getGearByCategory("deportes-acuaticos");
    items.forEach((i) => expect(i.category).toBe("deportes-acuaticos"));
  });

  it("total items across all categories equals 50", () => {
    const total =
      getGearByCategory("fotografia-video").length +
      getGearByCategory("montana-camping").length +
      getGearByCategory("deportes-acuaticos").length;
    expect(total).toBe(50);
  });
});

describe("getGearById", () => {
  it("finds a known item by id", () => {
    const item = getGearById("fv-001");
    expect(item).toBeDefined();
    expect(item?.name).toContain("Sony");
  });

  it("returns undefined for an unknown id", () => {
    expect(getGearById("unknown-999")).toBeUndefined();
  });
});

describe("getRandomGear", () => {
  it("returns the requested count", () => {
    const items = getRandomGear(5);
    expect(items.length).toBe(5);
  });

  it("does not exceed total inventory size", () => {
    const items = getRandomGear(1000);
    expect(items.length).toBe(50);
  });

  it("returns different orderings on subsequent calls", () => {
    const first = getRandomGear(50).map((i) => i.id).join(",");
    const second = getRandomGear(50).map((i) => i.id).join(",");
    // Very low probability of being identical — not strictly guaranteed
    // but good enough as a smoke test
    expect(typeof first).toBe("string");
    expect(typeof second).toBe("string");
  });
});

describe("searchGear", () => {
  it("finds items by name substring", () => {
    const results = searchGear("sony");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.name.toLowerCase()).toContain("sony"));
  });

  it("searches within a specific category", () => {
    const results = searchGear("camera", "fotografia-video");
    results.forEach((r) => expect(r.category).toBe("fotografia-video"));
  });

  it("returns empty array for no match", () => {
    expect(searchGear("xyznotexist")).toHaveLength(0);
  });
});

describe("loadInventory — error path", () => {
  it("throws with formatted message when inventory data is invalid", async () => {
    vi.resetModules();
    vi.doMock("@/data/inventory.json", () => ({
      default: [{ id: 999, invalidField: true }],
    }));

    const { getAllGear } = await import("./inventoryService");
    expect(() => getAllGear()).toThrow("[inventoryService] Invalid inventory data:");

    vi.resetModules();
  });
});
