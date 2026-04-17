import { describe, expect, it } from "vitest";
import { categorySchema, gearItemSchema, rentalRequestSchema } from "./validation";

describe("validation", () => {
  it("accepts valid category ids", () => {
    expect(categorySchema.safeParse("fotografia-video").success).toBe(true);
    expect(categorySchema.safeParse("unknown").success).toBe(false);
  });

  it("validates a gear item", () => {
    const ok = gearItemSchema.safeParse({
      id: "fv01",
      name: "Cámara",
      category: "fotografia-video",
      description: "desc",
      dailyRate: 100,
      imageURL: null,
      specs: { ISO: "100" },
      available: true,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a rental request with end before start", () => {
    const result = rentalRequestSchema.safeParse({
      gearId: "fv01",
      startDate: "2099-01-05",
      endDate: "2099-01-01",
      customerName: "Pablo",
      customerEmail: "p@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects past start dates", () => {
    const result = rentalRequestSchema.safeParse({
      gearId: "fv01",
      startDate: "2000-01-01",
      endDate: "2099-01-05",
      customerName: "Pablo",
      customerEmail: "p@example.com",
    });
    expect(result.success).toBe(false);
  });
});
