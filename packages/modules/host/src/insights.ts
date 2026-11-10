import { addDays, daysBetween, daysInMonth, firstOfMonth, firstOfNextMonth, toDate } from "./dates";
import { bookedRevenue, isActive, occupancyPct } from "./logic";
import type { Booking, BookingSource, HostTask } from "./types";

/** Percentage change from `previous` to `current`. Null when there is nothing to compare with. */
export function changePct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export const monthRange = (year: number, month: number) => ({ from: firstOfMonth(year, month), to: firstOfNextMonth(year, month) });

/** Occupancy of each month of `year` (index 0 = January), across the given properties. */
export function monthlyOccupancy(bookings: Booking[], propertyIds: string[], year: number): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const { from, to } = monthRange(year, i + 1);
    return occupancyPct(bookings, propertyIds, from, to);
  });
}

/** Booked income of each month of `year`, by check-in date (minor units). */
export function monthlyRevenue(bookings: Booking[], year: number): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const { from, to } = monthRange(year, i + 1);
    return bookedRevenue(bookings, from, to);
  });
}

/** How many live bookings arrive through each channel in [from, to), biggest first. */
export function sourceBreakdown(bookings: Booking[], from: string, to: string): { source: BookingSource; count: number }[] {
  const counts = new Map<BookingSource, number>();
  for (const b of bookings) {
    if (!isActive(b) || b.checkIn < from || b.checkIn >= to) continue;
    counts.set(b.source, (counts.get(b.source) ?? 0) + 1);
  }
  return [...counts.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
}

export type PropertyState =
  | { kind: "occupied"; booking: Booking }
  | { kind: "arriving"; booking: Booking; inDays: number }
  | { kind: "free"; next: Booking | null };

/** Where a property stands today: someone is staying, someone is about to arrive, or it is free. */
export function propertyState(bookings: Booking[], propertyId: string, today: string): PropertyState {
  const mine = bookings.filter((b) => isActive(b) && b.propertyId === propertyId && b.status !== "checked_out");
  const current = mine.find((b) => b.checkIn <= today && b.checkOut > today);
  if (current) return { kind: "occupied", booking: current };
  const next = mine.filter((b) => b.checkIn > today).sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0] ?? null;
  if (next) {
    const inDays = daysBetween(today, next.checkIn);
    if (inDays <= 3) return { kind: "arriving", booking: next, inDays };
  }
  return { kind: "free", next };
}

export type HostAlert =
  | { kind: "overdueTask"; id: string; task: HostTask; daysLate: number }
  | { kind: "arrivalPending"; id: string; booking: Booking }
  | { kind: "departurePending"; id: string; booking: Booking }
  | { kind: "noAmount"; id: string; booking: Booking }
  | { kind: "arrivalsToday"; id: string; count: number }
  | { kind: "departuresToday"; id: string; count: number };

/** Things that need a decision, most urgent first. Pure, so it is easy to test. */
export function hostAlerts(bookings: Booking[], tasks: HostTask[], today: string): HostAlert[] {
  const out: HostAlert[] = [];
  for (const task of tasks) {
    if (!task.done && task.dueOn && task.dueOn < today) out.push({ kind: "overdueTask", id: `t-${task.id}`, task, daysLate: daysBetween(task.dueOn, today) });
  }
  for (const b of bookings) {
    if (b.status === "checked_in" && b.checkOut < today) out.push({ kind: "departurePending", id: `d-${b.id}`, booking: b });
    else if (b.status === "confirmed" && b.checkIn < today && b.checkOut > today) out.push({ kind: "arrivalPending", id: `a-${b.id}`, booking: b });
  }
  const arrivals = bookings.filter((b) => b.status === "confirmed" && b.checkIn === today).length;
  const departures = bookings.filter((b) => b.status === "checked_in" && b.checkOut === today).length;
  if (arrivals > 0) out.push({ kind: "arrivalsToday", id: "arrivals-today", count: arrivals });
  if (departures > 0) out.push({ kind: "departuresToday", id: "departures-today", count: departures });
  for (const b of bookings) {
    if (b.status === "confirmed" && b.amount === 0 && b.checkOut >= today) out.push({ kind: "noAmount", id: `n-${b.id}`, booking: b });
  }
  return out;
}

/** The seven days (Monday first) of the week containing `day`, shifted by `weeks`. */
export function weekOf(day: string, weeks = 0): string[] {
  const dow = (toDate(day).getUTCDay() + 6) % 7;
  const monday = addDays(day, -dow + weeks * 7);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Days of the month that have at least one check-in or check-out, as a set of ISO dates. */
export function movementDays(bookings: Booking[]): Set<string> {
  const set = new Set<string>();
  for (const b of bookings) {
    if (!isActive(b)) continue;
    set.add(b.checkIn);
    set.add(b.checkOut);
  }
  return set;
}

/** Whole days in the month: handy for the calendar header. */
export const monthDays = daysInMonth;
