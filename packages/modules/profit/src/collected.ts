import type { IncomeRow, IncomeSource } from "./data";
import type { Minor } from "./types";

/** One collection (or refund, when negative) recorded on a booking. */
export interface PaymentFact {
  id: string;
  bookingId: string;
  amount: Minor;
  /** YYYY-MM-DD the money was received. */
  date: string;
}

/** What the ledger needs to know about the booking a payment belongs to. */
export interface BookingFact {
  id: string;
  propertyId: string;
  nights: number;
  /** Total price of the stay. */
  amount: Minor;
  source: IncomeSource;
}

/**
 * Income on a cash basis: what guests actually paid, on the day they paid it.
 *
 * Why: a booking's income used to reach the ledger as its FULL price (at check-in, or when sent by hand), whether or not
 * the guest had paid. Payments live on the booking, so the same stay could show two different amounts. Here:
 *  - every payment recorded on a booking becomes an income row on the day it was received (refunds are negative);
 *  - the old booking-linked income rows are left out, so nothing is counted twice;
 *  - income entered by hand and tied to no booking (extras, other sources) is kept as it is.
 * Nights are shared out in proportion to how much of the stay has been paid, so "nights sold" follows the money.
 * A payment whose booking is unknown is skipped (its stay was not loaded).
 */
export function collectedIncomes(input: { incomes: IncomeRow[]; payments: PaymentFact[]; bookings: BookingFact[] }): IncomeRow[] {
  const byId = new Map(input.bookings.map((b) => [b.id, b]));
  const grouped = new Map<string, PaymentFact[]>();
  for (const p of input.payments) {
    if (!byId.has(p.bookingId)) continue;
    const list = grouped.get(p.bookingId) ?? [];
    list.push(p);
    grouped.set(p.bookingId, list);
  }

  const fromPayments: IncomeRow[] = [];
  for (const [bookingId, list] of grouped) {
    const b = byId.get(bookingId)!;
    list.sort((a, c) => a.date.localeCompare(c.date) || a.id.localeCompare(c.id));
    let running = 0;
    let nightsSoFar = 0;
    for (const p of list) {
      running += p.amount;
      const share = b.amount > 0 ? Math.min(1, Math.max(0, running / b.amount)) : 0;
      const nightsNow = Math.round(b.nights * share);
      fromPayments.push({
        id: `pay-${p.id}`,
        propertyId: b.propertyId,
        amount: p.amount,
        nights: nightsNow - nightsSoFar,
        date: p.date,
        source: b.source,
        bookingId,
        fromPayment: true,
      });
      nightsSoFar = nightsNow;
    }
  }

  const manual = input.incomes.filter((i) => !i.bookingId);
  return [...manual, ...fromPayments].sort((a, b) => b.date.localeCompare(a.date));
}
