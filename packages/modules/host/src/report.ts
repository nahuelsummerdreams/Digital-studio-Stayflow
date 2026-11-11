import { daysBetween } from "./dates";
import { monthRange } from "./insights";
import { isActive, nightsWithin, occupancyPct } from "./logic";
import type { Booking, HostProperty } from "./types";

export interface PropertyReport {
  propertyId: string;
  name: string;
  bookings: number;
  nights: number;
  occupancy: number;
  billed: number;
  collected: number;
  pending: number;
  /** Average price per night booked, in minor units. 0 when nothing is priced. */
  avgNightly: number;
  avgStay: number;
}

export interface MonthReport {
  year: number;
  month: number;
  rows: PropertyReport[];
  totals: { bookings: number; nights: number; occupancy: number; billed: number; collected: number; pending: number };
}

/** Income is counted by check-in date (same rule as the dashboard); nights are the ones that fall inside the month. */
export function monthReport(bookings: Booking[], properties: HostProperty[], year: number, month: number): MonthReport {
  const { from, to } = monthRange(year, month);
  const rows = properties.map<PropertyReport>((p) => {
    const mine = bookings.filter((b) => isActive(b) && b.kind === "stay" && b.propertyId === p.id);
    const touching = mine.filter((b) => b.checkIn < to && from < b.checkOut);
    const starting = mine.filter((b) => b.checkIn >= from && b.checkIn < to);
    const nights = touching.reduce((s, b) => s + nightsWithin(b, from, to), 0);
    const billed = starting.reduce((s, b) => s + b.amount, 0);
    const collected = starting.reduce((s, b) => s + Math.min(b.paid, b.amount), 0);
    const pricedNights = starting.filter((b) => b.amount > 0).reduce((s, b) => s + b.nights, 0);
    return {
      propertyId: p.id,
      name: p.name,
      bookings: touching.length,
      nights,
      occupancy: occupancyPct(bookings, [p.id], from, to),
      billed,
      collected,
      pending: billed - collected,
      avgNightly: pricedNights > 0 ? Math.round(billed / pricedNights) : 0,
      avgStay: touching.length > 0 ? Math.round((touching.reduce((s, b) => s + b.nights, 0) / touching.length) * 10) / 10 : 0,
    };
  });
  const sum = (f: (r: PropertyReport) => number) => rows.reduce((s, r) => s + f(r), 0);
  return {
    year,
    month,
    rows,
    totals: {
      bookings: sum((r) => r.bookings),
      nights: sum((r) => r.nights),
      occupancy: occupancyPct(bookings.filter((b) => b.kind === "stay"), properties.map((p) => p.id), from, to),
      billed: sum((r) => r.billed),
      collected: sum((r) => r.collected),
      pending: sum((r) => r.pending),
    },
  };
}

export const daysInRange = daysBetween;
