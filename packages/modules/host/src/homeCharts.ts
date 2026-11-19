import { addDays, shiftMonth } from "./dates";
import { isActive } from "./logic";
import type { Booking } from "./types";

/** A dated money amount (integer minor units): an income received or an expense paid. */
export interface DatedAmount {
  amount: number;
  date: string;
}

export interface MonthPoint {
  year: number;
  /** 1–12. */
  month: number;
  collected: number;
  expenses: number;
}

/**
 * Money received and money spent in each of the last `months` calendar months, oldest first, ending with the month of `today`.
 * Months with nothing are kept (as zeros) so the chart always has the same shape.
 */
export function monthlyMoney(incomes: readonly DatedAmount[], expenses: readonly DatedAmount[], today: string, months = 6): MonthPoint[] {
  const [y, m] = today.split("-").map(Number) as [number, number];
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const { year, month } = shiftMonth(y, m, -i);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const sum = (list: readonly DatedAmount[]) => list.filter((e) => e.date.slice(0, 7) === key).reduce((s, e) => s + e.amount, 0);
    out.push({ year, month, collected: sum(incomes), expenses: sum(expenses) });
  }
  return out;
}

export interface OccupancyDay {
  date: string;
  /** Properties with a guest staying that night. */
  busy: number;
  /** 0–100, of all the properties. */
  pct: number;
}

/**
 * How full the properties are on each of the next `days` nights (today included). A night counts when a live stay covers it
 * (check-in on or before, check-out after). Blocks and canceled stays do not count. With no properties everything is 0.
 */
export function occupancyNext(bookings: readonly Booking[], propertyCount: number, today: string, days = 14): OccupancyDay[] {
  const stays = bookings.filter((b) => b.kind === "stay" && isActive(b));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i);
    const busy = new Set(stays.filter((b) => b.checkIn <= date && b.checkOut > date).map((b) => b.propertyId)).size;
    const pct = propertyCount > 0 ? Math.min(100, Math.round((busy / propertyCount) * 100)) : 0;
    return { date, busy, pct };
  });
}

/** Average occupancy of the given days, whole percent (0 when there are none). */
export const averageOccupancy = (days: readonly OccupancyDay[]): number => (days.length === 0 ? 0 : Math.round(days.reduce((s, d) => s + d.pct, 0) / days.length));
