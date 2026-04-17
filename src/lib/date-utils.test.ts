import { describe, it, expect } from "vitest";
import {
  calculateDays,
  calculatePrice,
  calculateInsuranceRate,
  INSURANCE_RATES,
  isAvailableDate,
  isValidRange,
  formatCurrency,
  formatDateEs,
} from "./date-utils";

// ─── INSURANCE_RATES constant ─────────────────────────────────────────────────

describe("INSURANCE_RATES", () => {
  it("photography equipment has 20% insurance rate", () => {
    expect(INSURANCE_RATES["fotografia-video"]).toBe(0.2);
  });

  it("mountain/camping equipment has 10% insurance rate", () => {
    expect(INSURANCE_RATES["montana-camping"]).toBe(0.1);
  });

  it("water sports equipment has 10% insurance rate", () => {
    expect(INSURANCE_RATES["deportes-acuaticos"]).toBe(0.1);
  });
});

// ─── calculateInsuranceRate ───────────────────────────────────────────────────

describe("calculateInsuranceRate", () => {
  it("returns 0.20 for fotografia-video (photography premium)", () => {
    expect(calculateInsuranceRate("fotografia-video")).toBe(0.2);
  });

  it("returns 0.10 for montana-camping", () => {
    expect(calculateInsuranceRate("montana-camping")).toBe(0.1);
  });

  it("returns 0.10 for deportes-acuaticos", () => {
    expect(calculateInsuranceRate("deportes-acuaticos")).toBe(0.1);
  });
});

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

describe("calculatePrice — Smart Insurance: fotografia-video (20%)", () => {
  it("applies 20% insurance to a 1-day photography rental", () => {
    const d = new Date("2026-05-01");
    const r = calculatePrice(1000, { from: d, to: d }, "fotografia-video");
    expect(r.days).toBe(1);
    expect(r.subtotal).toBe(1000);
    expect(r.insuranceRate).toBe(0.2);
    expect(r.insurance).toBeCloseTo(200, 5);
    expect(r.tax).toBeCloseTo(120, 5);
    expect(r.total).toBeCloseTo(1320, 5);
  });

  it("applies 20% insurance to a 3-day photography rental at $850/day", () => {
    const from = new Date("2026-05-01");
    const to = new Date("2026-05-03");
    const r = calculatePrice(850, { from, to }, "fotografia-video");
    expect(r.days).toBe(3);
    expect(r.subtotal).toBe(2550);
    expect(r.insurance).toBeCloseTo(510, 5);   // 20% of 2550
    expect(r.tax).toBeCloseTo(306, 5);          // 12% of 2550
    expect(r.total).toBeCloseTo(3366, 5);       // 2550 + 510 + 306
  });

  it("applies 20% insurance to a 7-day photography rental", () => {
    const from = new Date("2026-05-01");
    const to = new Date("2026-05-07");
    const r = calculatePrice(850, { from, to }, "fotografia-video");
    expect(r.days).toBe(7);
    expect(r.subtotal).toBe(5950);
    expect(r.insurance).toBeCloseTo(1190, 5);  // 20% of 5950
    expect(r.total).toBeCloseTo(5950 + 1190 + 714, 5);
  });
});

describe("calculatePrice — Smart Insurance: montana-camping (10%)", () => {
  it("applies 10% insurance to a 1-day camping rental", () => {
    const d = new Date("2026-05-01");
    const r = calculatePrice(500, { from: d, to: d }, "montana-camping");
    expect(r.insuranceRate).toBe(0.1);
    expect(r.insurance).toBeCloseTo(50, 5);
    expect(r.tax).toBeCloseTo(60, 5);
    expect(r.total).toBeCloseTo(610, 5);
  });

  it("applies 10% insurance to a 5-day camping rental", () => {
    const from = new Date("2026-06-01");
    const to = new Date("2026-06-05");
    const r = calculatePrice(200, { from, to }, "montana-camping");
    expect(r.days).toBe(5);
    expect(r.subtotal).toBe(1000);
    expect(r.insurance).toBeCloseTo(100, 5);
    expect(r.tax).toBeCloseTo(120, 5);
    expect(r.total).toBeCloseTo(1220, 5);
  });
});

describe("calculatePrice — Smart Insurance: deportes-acuaticos (10%)", () => {
  it("applies 10% insurance to a water sports rental", () => {
    const d = new Date("2026-05-01");
    const r = calculatePrice(600, { from: d, to: d }, "deportes-acuaticos");
    expect(r.insuranceRate).toBe(0.1);
    expect(r.insurance).toBeCloseTo(60, 5);
    expect(r.tax).toBeCloseTo(72, 5);
    expect(r.total).toBeCloseTo(732, 5);
  });
});

describe("calculatePrice — general", () => {
  it("photography insurance (20%) is higher than other categories (10%) for same rental", () => {
    const range = { from: new Date("2026-05-01"), to: new Date("2026-05-03") };
    const photo = calculatePrice(500, range, "fotografia-video");
    const camping = calculatePrice(500, range, "montana-camping");
    expect(photo.insurance).toBeGreaterThan(camping.insurance);
    expect(photo.insurance).toBe(camping.insurance * 2);
  });

  it("exposes dailyRate in breakdown for UI display", () => {
    const d = new Date("2026-05-01");
    const r = calculatePrice(750, { from: d, to: d }, "montana-camping");
    expect(r.dailyRate).toBe(750);
  });

  it("returns zero subtotal, insurance and total for a reversed range", () => {
    const r = calculatePrice(500, { from: new Date("2026-05-10"), to: new Date("2026-05-01") }, "fotografia-video");
    expect(r.days).toBe(0);
    expect(r.subtotal).toBe(0);
    expect(r.insurance).toBe(0);
    expect(r.total).toBe(0);
  });

  it("tax is exactly 12% of subtotal regardless of insurance", () => {
    const d = new Date("2026-05-01");
    const r = calculatePrice(1000, { from: d, to: d }, "fotografia-video");
    expect(r.tax / r.subtotal).toBeCloseTo(0.12, 10);
  });

  it("allows rentals longer than 7 days with correct insurance", () => {
    const from = new Date("2026-05-01");
    const to = new Date("2026-05-14"); // 14 days
    const r = calculatePrice(200, { from, to }, "fotografia-video");
    expect(r.days).toBe(14);
    expect(r.subtotal).toBe(2800);
    expect(r.insurance).toBeCloseTo(560, 5); // 20% of 2800
  });

  it("handles cross-month range with correct insurance (Jan 28 → Feb 3)", () => {
    const r = calculatePrice(200, { from: new Date("2026-01-28"), to: new Date("2026-02-03") }, "montana-camping");
    expect(r.days).toBe(7);
    expect(r.subtotal).toBe(1400);
    expect(r.insurance).toBeCloseTo(140, 5); // 10%
    expect(r.total).toBeCloseTo(1400 + 140 + 168, 5);
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

  it("returns false when end equals start", () => {
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

  it("produces a non-trivial string with currency marker", () => {
    expect(formatCurrency(100).length).toBeGreaterThan(3);
  });
});

// ─── formatDateEs ─────────────────────────────────────────────────────────────

describe("formatDateEs", () => {
  it("formats May 1st 2026 in full Spanish", () => {
    const result = formatDateEs(new Date(2026, 4, 1, 12));
    expect(result).toContain("mayo");
    expect(result).toContain("2026");
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
