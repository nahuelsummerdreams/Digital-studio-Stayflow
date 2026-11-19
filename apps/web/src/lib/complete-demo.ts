/**
 * The little interactive demo on the COMPLETE landing: a week with three properties, who has paid and who still owes.
 * Everything here is INVENTED sample data (the page says so). The functions are pure so they can be tested.
 */
export type DemoStatus = "paid" | "partial" | "pending";

export interface DemoBooking {
  id: string;
  guest: string;
  place: string;
  /** Row in the calendar (one per property). */
  row: number;
  /** First day of the stay, 0 = Monday … 6 = Sunday. */
  start: number;
  /** Number of days the bar covers. */
  len: number;
  total: number;
  paid: number;
}

export const DEMO_PLACES = ["Casa del Lago", "Depto Centro", "Loft Palermo"] as const;
export const DEMO_DAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;

export const DEMO_BOOKINGS: readonly DemoBooking[] = [
  { id: "a", guest: "Familia Rossi", place: "Casa del Lago", row: 0, start: 0, len: 4, total: 1200, paid: 360 },
  { id: "b", guest: "Marta P.", place: "Casa del Lago", row: 0, start: 5, len: 2, total: 500, paid: 500 },
  { id: "c", guest: "Carlos M.", place: "Depto Centro", row: 1, start: 1, len: 3, total: 650, paid: 0 },
  { id: "d", guest: "Ana y Leo", place: "Loft Palermo", row: 2, start: 2, len: 5, total: 1400, paid: 700 },
];

export const owedOf = (b: Pick<DemoBooking, "total" | "paid">): number => Math.max(0, b.total - b.paid);

export const totalOwed = (list: readonly DemoBooking[]): number => list.reduce((s, b) => s + owedOf(b), 0);

export function statusOf(b: Pick<DemoBooking, "total" | "paid">): DemoStatus {
  if (b.paid >= b.total) return "paid";
  return b.paid > 0 ? "partial" : "pending";
}

/** How much the next click registers: the deposit (30%) if nothing was paid yet, otherwise the rest. Always a whole number. */
export function nextPayment(b: Pick<DemoBooking, "total" | "paid">): number {
  if (b.paid >= b.total) return 0;
  if (b.paid === 0) return Math.min(b.total, Math.round((b.total * 0.3) / 10) * 10);
  return b.total - b.paid;
}

/** Registers a payment on one booking. Never goes over the total, ignores amounts that are not positive and unknown ids. */
export function registerPayment(list: readonly DemoBooking[], id: string, amount: number): DemoBooking[] {
  return list.map((b) => {
    if (b.id !== id || !(amount > 0)) return b;
    return { ...b, paid: Math.min(b.total, b.paid + amount) };
  });
}

/** The booking the automatic demo pays next: the first one that still owes, after the one paid last (so it walks through all of them). */
export function nextToPay(list: readonly DemoBooking[], afterId?: string): DemoBooking | undefined {
  const owing = list.filter((b) => owedOf(b) > 0);
  if (owing.length === 0) return undefined;
  const i = afterId ? list.findIndex((b) => b.id === afterId) : -1;
  for (let k = 1; k <= list.length; k++) {
    const c = list[(i + k + list.length) % list.length];
    if (c && owedOf(c) > 0) return c;
  }
  return owing[0];
}

/** True when a stay of `len` days starting at `start` fits in the week and does not touch any other stay of that property. */
export function canBook(list: readonly DemoBooking[], row: number, start: number, len: number): boolean {
  if (!Number.isInteger(start) || !Number.isInteger(len) || start < 0 || len < 1 || start + len > 7) return false;
  return !list.some((b) => b.row === row && start < b.start + b.len && b.start < start + len);
}

/** Adds a stay if it fits; otherwise returns the same list untouched (the real app also refuses to save two stays on top of each other). */
export function addBooking(list: readonly DemoBooking[], b: DemoBooking): DemoBooking[] {
  return canBook(list, b.row, b.start, b.len) ? [...list, b] : [...list];
}
