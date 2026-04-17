import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PriceBreakdown {
  days: number;
  dailyRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

const TAX_RATE = 0.12;

export function calculateRentalDays(startDate: Date, endDate: Date): number {
  const days = differenceInCalendarDays(endDate, startDate) + 1;
  return Math.max(0, days);
}

export function calculateTotalPrice(dailyRate: number, days: number): number {
  return dailyRate * days;
}

export function calculateRentalPrice(
  dailyRate: number,
  startDate: Date,
  endDate: Date
): PriceBreakdown {
  const days = calculateRentalDays(startDate, endDate);
  const subtotal = calculateTotalPrice(dailyRate, days);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  return { days, dailyRate, subtotal, tax, total };
}

export function formatDate(date: Date, formatStr: string = "d 'de' MMMM, yyyy"): string {
  if (!isValid(date)) return "Fecha inválida";
  return format(date, formatStr, { locale: es });
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  return `${formatDate(startDate, "d MMM")} - ${formatDate(endDate, "d MMM yyyy")}`;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isDateInPast(date: Date): boolean {
  return isBefore(startOfDay(date), startOfDay(new Date()));
}

export function isValidRentalRange(startDate: Date, endDate: Date): boolean {
  if (isDateInPast(startDate)) return false;
  return !isBefore(endDate, startDate);
}

export function getMinSelectableDate(): Date {
  return startOfDay(new Date());
}

export function getDefaultEndDate(startDate: Date): Date {
  return addDays(startDate, 2);
}

export function parseDateSafe(dateString: string): Date | null {
  try {
    const d = parseISO(dateString);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}
