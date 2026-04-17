import { describe, expect, it } from "vitest";
import {
  calculateRentalDays,
  calculateRentalPrice,
  calculateTotalPrice,
  formatDate,
  formatDateRange,
  formatPrice,
  getDefaultEndDate,
  getMinSelectableDate,
  isDateInPast,
  isValidRentalRange,
  parseDateSafe,
} from "./date-utils";

describe("date-utils", () => {
  it("counts rental days inclusively", () => {
    expect(calculateRentalDays(new Date("2026-05-01"), new Date("2026-05-03"))).toBe(3);
    expect(calculateRentalDays(new Date("2026-05-01"), new Date("2026-05-01"))).toBe(1);
  });

  it("computes total price linearly", () => {
    expect(calculateTotalPrice(100, 5)).toBe(500);
  });

  it("breaks down rental price with 12% tax", () => {
    const p = calculateRentalPrice(100, new Date("2026-05-01"), new Date("2026-05-03"));
    expect(p.days).toBe(3);
    expect(p.subtotal).toBe(300);
    expect(p.tax).toBeCloseTo(36);
    expect(p.total).toBeCloseTo(336);
  });

  it("formats and handles invalid dates", () => {
    expect(formatDate(new Date("invalid"))).toBe("Fecha inválida");
    expect(formatDate(new Date("2026-05-01"))).toMatch(/2026/);
    expect(formatDateRange(new Date("2026-05-01"), new Date("2026-05-03"))).toMatch(/-/);
  });

  it("formats price in MXN without decimals", () => {
    expect(formatPrice(1200)).toMatch(/1,200/);
  });

  it("detects past dates", () => {
    expect(isDateInPast(new Date("2000-01-01"))).toBe(true);
    expect(isDateInPast(new Date("2099-01-01"))).toBe(false);
  });

  it("validates rental range", () => {
    expect(isValidRentalRange(new Date("2000-01-01"), new Date("2099-01-01"))).toBe(false);
    expect(isValidRentalRange(new Date("2099-01-01"), new Date("2099-01-05"))).toBe(true);
    expect(isValidRentalRange(new Date("2099-01-05"), new Date("2099-01-01"))).toBe(false);
  });

  it("returns today as min selectable date", () => {
    const min = getMinSelectableDate();
    expect(min.getHours()).toBe(0);
  });

  it("defaults end date to +2 days", () => {
    const start = new Date("2026-05-01");
    const end = getDefaultEndDate(start);
    expect(calculateRentalDays(start, end)).toBe(3);
  });

  it("parses ISO strings safely", () => {
    expect(parseDateSafe("2026-05-01")).toBeInstanceOf(Date);
    expect(parseDateSafe("not-a-date")).toBeNull();
  });
});
