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

/**
 * `overdue`: the payment date has passed, or (with no date set) the guest already arrived and still owes.
 * `soon`: due, or arriving, within a week. `later`: further out.
 */
export type OwedUrgency = "overdue" | "soon" | "later";
export interface OwedRow {
  booking: Booking;
  /** What is still missing, integer minor units. */
  owed: number;
  /** Negative once the guest has already arrived. */
  daysToCheckIn: number;
  /** The next date a payment is expected, if the owner set one. */
  dueOn: string | null;
  /** Negative once the due date has passed. Null without a due date. */
  daysToDue: number | null;
  urgency: OwedUrgency;
}

/**
 * The next date money is expected for a booking, if any: the deposit date while nothing has been paid,
 * otherwise the balance date. Null when the owner did not set one or nothing is owed.
 */
export function nextDueOn(b: Pick<Booking, "amount" | "paid" | "depositDueOn" | "balanceDueOn">): string | null {
  if (b.amount - b.paid <= 0) return null;
  if (b.paid <= 0) return b.depositDueOn ?? b.balanceDueOn ?? null;
  return b.balanceDueOn ?? null;
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
  /** The part of it whose payment date has already passed. */
  pastDue: { count: number; total: number };
  /** This calendar month. Billed and pending are by check-in date. Collected is what was received in the month (by payment date) when the ledger is provided; otherwise what guests have paid on the month's stays. */
  month: { billed: number; collected: number; pending: number; expenses: number; result: number };
  jobs: { cleaningOpen: number; maintenanceOpen: number; overdue: number };
}

/**
 * Everything the owner's home screen shows, in one pure function so it can be tested.
 * The headline money figure is what was COLLECTED (decision of 2026-11-18); what was billed is secondary.
 */
export function ownerOverview(input: { bookings: Booking[]; jobs: OverviewJob[]; expenses: OverviewExpense[]; today: string; collectedIncomes?: OverviewExpense[] }): OwnerOverview {
  const { bookings, jobs, expenses, today } = input;
  const [y, m] = today.split("-").map(Number) as [number, number];
  const from = firstOfMonth(y, m);
  const to = firstOfNextMonth(y, m);

  const stays = bookings.filter((b) => b.kind === "stay" && isActive(b));
  const inHouse = stays.filter((b) => b.checkIn <= today && b.checkOut > today);

  const owedList: OwedRow[] = pendingPayments(bookings)
    .map((b) => {
      const days = daysBetween(today, b.checkIn);
      const dueOn = nextDueOn(b);
      const daysToDue = dueOn ? daysBetween(today, dueOn) : null;
      // With a due date, that date decides; without one, the arrival does.
      const ref = daysToDue ?? days;
      const urgency: OwedUrgency = ref < 0 ? "overdue" : ref <= 7 ? "soon" : "later";
      return { booking: b, owed: owed(b), daysToCheckIn: days, dueOn, daysToDue, urgency, ref };
    })
    .sort((a, b) => a.ref - b.ref || a.daysToCheckIn - b.daysToCheckIn)
    .map(({ ref: _ref, ...row }) => row);
  const late = owedList.filter((r) => r.daysToDue !== null && r.daysToDue < 0);

  const totals = paymentTotals(bookings, from, to);
  // When the finance ledger is available, "collected" is the money received IN the month (by payment date), the same figure Finanzas shows.
  const received = input.collectedIncomes ? input.collectedIncomes.filter((e) => e.date >= from && e.date < to).reduce((s, e) => s + e.amount, 0) : totals.collected;
  const monthExpenses = expenses.filter((e) => e.date >= from && e.date < to).reduce((s, e) => s + e.amount, 0);

  const open = jobs.filter((j) => j.status !== "done");

  return {
    staying: { stays: inHouse.length, guests: inHouse.reduce((s, b) => s + b.guestsCount, 0) },
    activeBookings: stays.filter((b) => b.checkOut >= today).length,
    arrivalsNext7: upcomingArrivals(bookings, today, 7).filter((b) => b.kind === "stay").length,
    departuresToday: stays.filter((b) => b.checkOut === today).length,
    owedTotal: owedList.reduce((s, r) => s + r.owed, 0),
    owedList,
    pastDue: { count: late.length, total: late.reduce((s, r) => s + r.owed, 0) },
    month: { ...totals, collected: received, expenses: monthExpenses, result: received - monthExpenses },
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
