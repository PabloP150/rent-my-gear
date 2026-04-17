import { describe, expect, it } from "vitest";
import {
  getAllGear,
  getGearById,
  getGearByCategory,
  getRandomGear,
  searchGear,
} from "./inventoryService";

describe("inventoryService", () => {
  it("loads all 50 items", () => {
    expect(getAllGear()).toHaveLength(50);
  });

  it("gets an item by id", () => {
    const item = getGearById("fv01");
    expect(item?.name).toContain("Sony");
  });

  it("filters by category", () => {
    const photos = getGearByCategory("fotografia-video");
    expect(photos.length).toBeGreaterThan(0);
    expect(photos.every((i) => i.category === "fotografia-video")).toBe(true);
  });

  it("returns N random items", () => {
    const picks = getRandomGear(5);
    expect(picks).toHaveLength(5);
  });

  it("searches by name", () => {
    const results = searchGear("fotografia-video", "sony");
    expect(results.length).toBeGreaterThan(0);
  });
});
