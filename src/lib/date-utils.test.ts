import { describe, it, expect } from "vitest";
import {
  calculateDays,
  calculatePrice,
  isAvailableDate,
  isValidRange,
  formatCurrency,
  formatDateEs,
} from "./date-utils";

// ─── calculateDays ────────────────────────────────────────────────────────────

describe("calculateDays", () => {
  it("returns 1 for a single-day rental (same from and to)", () => {
    const d = new Date("2026-05-01");
    expect(calculateDays({ from: d, to: d })).toBe(1);
  });

  it("returns 7 for exactly one week (May 1–7)", () => {
    expect(calculateDays({ from: new Date("2026-05-01"), to: new Date("2026-05-07") })).toBe(7);
  });

  it("returns 14 for two weeks", () => {
    expect(calculateDays({ from: new Date("2026-06-01"), to: new Date("2026-06-14") })).toBe(14);
  });

  it("returns 30 for a full month rental", () => {
    expect(calculateDays({ from: new Date("2026-06-01"), to: new Date("2026-06-30") })).toBe(30);
  });

  it("counts correctly across a month boundary (Jan 28 → Feb 3 = 7 days)", () => {
    expect(calculateDays({ from: new Date("2026-01-28"), to: new Date("2026-02-03") })).toBe(7);
  });

  it("counts correctly across a year boundary (Dec 29 → Jan 2 = 5 days)", () => {
    expect(calculateDays({ from: new Date("2025-12-29"), to: new Date("2026-01-02") })).toBe(5);
  });

  it("returns 0 (not negative) when 'to' is before 'from'", () => {
    expect(calculateDays({ from: new Date("2026-05-10"), to: new Date("2026-05-01") })).toBe(0);
  });
});

// ─── calculatePrice ───────────────────────────────────────────────────────────

describe("calculatePrice", () => {
  it("prices a 1-day rental correctly — catches off-by-one", () => {
    const d = new Date("2026-05-01");
    const r = calculatePrice(500, { from: d, to: d });
    expect(r.days).toBe(1);
    expect(r.subtotal).toBe(500);
    expect(r.tax).toBeCloseTo(60, 5);
    expect(r.total).toBeCloseTo(560, 5);
  });

  it("prices a 3-day rental at $100/day (subtotal $300, tax $36, total $336)", () => {
    const r = calculatePrice(100, { from: new Date("2026-05-01"), to: new Date("2026-05-03") });
    expect(r.days).toBe(3);
    expect(r.subtotal).toBe(300);
    expect(r.tax).toBeCloseTo(36, 5);
    expect(r.total).toBeCloseTo(336, 5);
  });

  it("prices a 7-day rental at $850/day (subtotal $5950)", () => {
    const r = calculatePrice(850, { from: new Date("2026-05-01"), to: new Date("2026-05-07") });
    expect(r.days).toBe(7);
    expect(r.subtotal).toBe(5950);
    expect(r.tax).toBeCloseTo(714, 5);
    expect(r.total).toBeCloseTo(6664, 5);
  });

  it("allows rentals longer than 7 days — no artificial cap", () => {
    const r = calculatePrice(200, { from: new Date("2026-05-01"), to: new Date("2026-05-14") });
    expect(r.days).toBe(14);
    expect(r.subtotal).toBe(2800);
  });

  it("prices a 30-day rental correctly", () => {
    const r = calculatePrice(150, { from: new Date("2026-06-01"), to: new Date("2026-06-30") });
    expect(r.days).toBe(30);
    expect(r.subtotal).toBe(4500);
    expect(r.total).toBeCloseTo(5040, 5);
  });

  it("prices a cross-month range (Jan 28 → Feb 3, 7 days) at $200/day", () => {
    const r = calculatePrice(200, { from: new Date("2026-01-28"), to: new Date("2026-02-03") });
    expect(r.days).toBe(7);
    expect(r.subtotal).toBe(1400);
    expect(r.total).toBeCloseTo(1568, 5);
  });

  it("applies exactly 12% IVA regardless of daily rate", () => {
    const r = calculatePrice(1000, { from: new Date("2026-05-01"), to: new Date("2026-05-01") });
    expect(r.tax / r.subtotal).toBeCloseTo(0.12, 10);
  });

  it("handles decimal daily rates without floating-point blowup", () => {
    const r = calculatePrice(333.33, { from: new Date("2026-05-01"), to: new Date("2026-05-04") });
    expect(r.days).toBe(4);
    expect(r.subtotal).toBeCloseTo(1333.32, 2);
    expect(r.total).toBeCloseTo(1333.32 * 1.12, 2);
  });

  it("returns 0 subtotal for an invalid (reversed) date range", () => {
    const r = calculatePrice(500, { from: new Date("2026-05-10"), to: new Date("2026-05-01") });
    expect(r.days).toBe(0);
    expect(r.subtotal).toBe(0);
    expect(r.total).toBe(0);
  });

  it("exposes the dailyRate in the breakdown for UI display", () => {
    const r = calculatePrice(750, { from: new Date("2026-05-01"), to: new Date("2026-05-03") });
    expect(r.dailyRate).toBe(750);
  });
});

// ─── isAvailableDate ──────────────────────────────────────────────────────────

describe("isAvailableDate", () => {
  it("returns true for today", () => {
    expect(isAvailableDate(new Date())).toBe(true);
  });

  it("returns true for a date 30 days in the future", () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    expect(isAvailableDate(future)).toBe(true);
  });

  it("returns false for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isAvailableDate(yesterday)).toBe(false);
  });

  it("returns false for a far past date", () => {
    expect(isAvailableDate(new Date("2020-01-01"))).toBe(false);
  });
});

// ─── isValidRange ─────────────────────────────────────────────────────────────

describe("isValidRange", () => {
  it("returns true when end is strictly after start", () => {
    expect(isValidRange(new Date("2026-05-01"), new Date("2026-05-05"))).toBe(true);
  });

  it("returns false when end equals start (same instant)", () => {
    const d = new Date("2026-05-01");
    expect(isValidRange(d, d)).toBe(false);
  });

  it("returns false when end is before start", () => {
    expect(isValidRange(new Date("2026-05-10"), new Date("2026-05-01"))).toBe(false);
  });
});

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats MXN and includes the amount digits", () => {
    const result = formatCurrency(1500);
    expect(result).toContain("1");
    expect(result).toContain("500");
  });

  it("produces a non-trivial string (includes currency marker)", () => {
    expect(formatCurrency(100).length).toBeGreaterThan(3);
  });
});

// ─── formatDateEs ─────────────────────────────────────────────────────────────

describe("formatDateEs", () => {
  it("formats May 1st 2026 in full Spanish", () => {
    // Use local noon to avoid UTC-offset shifting the date to April 30
    const result = formatDateEs(new Date(2026, 4, 1, 12));
    expect(result).toContain("mayo");
    expect(result).toContain("2026");
    expect(result).toContain("1");
  });

  it("uses 'de' separators between day, month and year", () => {
    const result = formatDateEs(new Date(2026, 11, 25, 12));
    expect(result).toBe("25 de diciembre de 2026");
  });

  it("uses Spanish month names (not English)", () => {
    const result = formatDateEs(new Date(2026, 2, 10, 12));
    expect(result).toContain("marzo");
    expect(result).not.toContain("March");
  });
});
