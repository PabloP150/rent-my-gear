import { differenceInCalendarDays, format, isAfter, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Category } from "./validation";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PriceBreakdown {
  days: number;
  dailyRate: number;
  subtotal: number;
  insuranceRate: number;
  insurance: number;
  tax: number;
  total: number;
}

const TAX_RATE = 0.12;

export const INSURANCE_RATES: Record<Category, number> = {
  "fotografia-video": 0.2,
  "montana-camping": 0.1,
  "deportes-acuaticos": 0.1,
};

/** Returns number of rental days for a date range (inclusive). */
export function calculateDays(range: DateRange): number {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  return Math.max(0, days);
}

/** Returns the insurance rate (0–1) for a gear category. Photography: 20%, others: 10%. */
export function calculateInsuranceRate(category: Category): number {
  return INSURANCE_RATES[category];
}

/** Full price breakdown including 12% IVA and Smart Insurance. */
export function calculatePrice(
  dailyRate: number,
  range: DateRange,
  category: Category
): PriceBreakdown {
  const days = calculateDays(range);
  const subtotal = dailyRate * days;
  const insuranceRate = calculateInsuranceRate(category);
  const insurance = subtotal * insuranceRate;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + insurance + tax;
  return { days, dailyRate, subtotal, insuranceRate, insurance, tax, total };
}

/** Format a date in Spanish locale, e.g. "16 de abril de 2026". */
export function formatDateEs(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** Format currency in MXN. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

/** Returns true if the date is today or in the future. */
export function isAvailableDate(date: Date): boolean {
  return !isBefore(startOfDay(date), startOfDay(new Date()));
}

/** Returns true if end is strictly after start. */
export function isValidRange(start: Date, end: Date): boolean {
  return isAfter(end, start);
}
