import { daysBetween, firstOfMonth, firstOfNextMonth } from "./dates";
import { isActive, owed, pendingPayments, paymentTotals, upcomingArrivals } from "./logic";
import type { Booking } from "./types";

/** The few fields of an Operations job the owner's home needs (kept structural so Host does not depend on Operations). */
export interface OverviewJob {
  kind: string;
  status: string;
  dueOn: string;
}
export interface OverviewExpense {
  amount: number;
  date: string;
}

/** `overdue`: the guest already arrived and still owes. `soon`: arrives within a week with a balance. `later`: further out. */
export type OwedUrgency = "overdue" | "soon" | "later";
export interface OwedRow {
  booking: Booking;
  /** What is still missing, integer minor units. */
  owed: number;
  /** Negative once the guest has already arrived. */
  daysToCheckIn: number;
  urgency: OwedUrgency;
}

export interface OwnerOverview {
  /** Stays between check-in and check-out today. */
  staying: { stays: number; guests: number };
  /** Live stays that have not ended yet. */
  activeBookings: number;
  arrivalsNext7: number;
  departuresToday: number;
  /** Money still to collect, with the sorted list behind it. */
  owedTotal: number;
  owedList: OwedRow[];
  /** This calendar month, by check-in date. Collected = what guests have actually paid, never more than the stay's total. */
  month: { billed: number; collected: number; pending: number; expenses: number; result: number };
  jobs: { cleaningOpen: number; maintenanceOpen: number; overdue: number };
}

/**
 * Everything the owner's home screen shows, in one pure function so it can be tested.
 * The headline money figure is what was COLLECTED (decision of 2026-11-18); what was billed is secondary.
 */
export function ownerOverview(input: { bookings: Booking[]; jobs: OverviewJob[]; expenses: OverviewExpense[]; today: string }): OwnerOverview {
  const { bookings, jobs, expenses, today } = input;
  const [y, m] = today.split("-").map(Number) as [number, number];
  const from = firstOfMonth(y, m);
  const to = firstOfNextMonth(y, m);

  const stays = bookings.filter((b) => b.kind === "stay" && isActive(b));
  const inHouse = stays.filter((b) => b.checkIn <= today && b.checkOut > today);

  const owedList: OwedRow[] = pendingPayments(bookings)
    .map((b) => {
      const days = daysBetween(today, b.checkIn);
      const urgency: OwedUrgency = days < 0 ? "overdue" : days <= 7 ? "soon" : "later";
      return { booking: b, owed: owed(b), daysToCheckIn: days, urgency };
    })
    .sort((a, b) => a.daysToCheckIn - b.daysToCheckIn);

  const totals = paymentTotals(bookings, from, to);
  const monthExpenses = expenses.filter((e) => e.date >= from && e.date < to).reduce((s, e) => s + e.amount, 0);

  const open = jobs.filter((j) => j.status !== "done");

  return {
    staying: { stays: inHouse.length, guests: inHouse.reduce((s, b) => s + b.guestsCount, 0) },
    activeBookings: stays.filter((b) => b.checkOut >= today).length,
    arrivalsNext7: upcomingArrivals(bookings, today, 7).filter((b) => b.kind === "stay").length,
    departuresToday: stays.filter((b) => b.checkOut === today).length,
    owedTotal: owedList.reduce((s, r) => s + r.owed, 0),
    owedList,
    month: { ...totals, expenses: monthExpenses, result: totals.collected - monthExpenses },
    jobs: {
      cleaningOpen: open.filter((j) => j.kind === "cleaning").length,
      maintenanceOpen: open.filter((j) => j.kind === "maintenance").length,
      overdue: open.filter((j) => j.dueOn < today).length,
    },
  };
}

/** Plain-language line for one row of "who still owes": when they arrive (or arrived) and how much is missing. */
export function owedWhen(daysToCheckIn: number): { kind: "arrived" | "today" | "tomorrow" | "inDays"; days: number } {
  if (daysToCheckIn < 0) return { kind: "arrived", days: -daysToCheckIn };
  if (daysToCheckIn === 0) return { kind: "today", days: 0 };
  if (daysToCheckIn === 1) return { kind: "tomorrow", days: 1 };
  return { kind: "inDays", days: daysToCheckIn };
}
