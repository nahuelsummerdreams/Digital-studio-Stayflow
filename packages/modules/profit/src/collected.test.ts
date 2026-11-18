import { describe, expect, it } from "vitest";
import { collectedIncomes, type BookingFact, type PaymentFact } from "./collected";
import type { IncomeRow } from "./data";

const booking = (over: Partial<BookingFact> = {}): BookingFact => ({ id: "b1", propertyId: "p1", nights: 4, amount: 100_000, source: "direct", ...over });
const pay = (id: string, amount: number, date: string, bookingId = "b1"): PaymentFact => ({ id, bookingId, amount, date });
const income = (over: Partial<IncomeRow> = {}): IncomeRow => ({ id: "i1", propertyId: "p1", amount: 5_000, nights: 0, date: "2026-11-05", source: "other", bookingId: null, ...over });

describe("collectedIncomes", () => {
  it("turns each payment into an income on the day it was received", () => {
    const out = collectedIncomes({ incomes: [], bookings: [booking()], payments: [pay("a", 30_000, "2026-11-02"), pay("b", 70_000, "2026-11-20")] });
    expect(out.map((r) => [r.date, r.amount, r.propertyId, r.source, r.fromPayment])).toEqual([
      ["2026-11-20", 70_000, "p1", "direct", true],
      ["2026-11-02", 30_000, "p1", "direct", true],
    ]);
  });

  it("does not count a booking twice: the old full-price row is dropped when payments exist", () => {
    const old = income({ id: "old", amount: 100_000, nights: 4, source: "direct", bookingId: "b1", date: "2026-11-10" });
    const out = collectedIncomes({ incomes: [old], bookings: [booking()], payments: [pay("a", 40_000, "2026-11-02")] });
    expect(out.reduce((s, r) => s + r.amount, 0)).toBe(40_000);
    expect(out.some((r) => r.id === "old")).toBe(false);
  });

  it("shows nothing for a booking nobody has paid, even if the old row says the full price", () => {
    const old = income({ id: "old", amount: 100_000, nights: 4, bookingId: "b1" });
    const out = collectedIncomes({ incomes: [old], bookings: [booking()], payments: [] });
    expect(out).toEqual([]);
  });

  it("keeps income entered by hand that is tied to no booking", () => {
    const out = collectedIncomes({ incomes: [income({ id: "extra", amount: 8_000 })], bookings: [booking()], payments: [pay("a", 10_000, "2026-11-02")] });
    expect(out.map((r) => r.id).sort()).toEqual(["extra", "pay-a"]);
    expect(out.reduce((s, r) => s + r.amount, 0)).toBe(18_000);
  });

  it("shares the nights out in proportion to what has been paid, and they add up to the stay", () => {
    const half = collectedIncomes({ incomes: [], bookings: [booking({ nights: 4 })], payments: [pay("a", 50_000, "2026-11-02")] });
    expect(half.reduce((s, r) => s + r.nights, 0)).toBe(2);
    const full = collectedIncomes({ incomes: [], bookings: [booking({ nights: 4 })], payments: [pay("a", 25_000, "2026-11-02"), pay("b", 25_000, "2026-11-03"), pay("c", 50_000, "2026-11-04")] });
    expect(full.reduce((s, r) => s + r.nights, 0)).toBe(4);
  });

  it("never recognizes more nights than the stay has when a guest overpays", () => {
    const out = collectedIncomes({ incomes: [], bookings: [booking({ nights: 3, amount: 90_000 })], payments: [pay("a", 90_000, "2026-11-02"), pay("b", 30_000, "2026-11-03")] });
    expect(out.reduce((s, r) => s + r.nights, 0)).toBe(3);
  });

  it("counts a refund as negative income and takes its nights back", () => {
    const out = collectedIncomes({ incomes: [], bookings: [booking({ nights: 4 })], payments: [pay("a", 100_000, "2026-11-02"), pay("b", -50_000, "2026-11-12")] });
    expect(out.reduce((s, r) => s + r.amount, 0)).toBe(50_000);
    expect(out.reduce((s, r) => s + r.nights, 0)).toBe(2);
  });

  it("counts a deposit kept from a canceled booking, since that money was received", () => {
    const out = collectedIncomes({ incomes: [], bookings: [booking()], payments: [pay("a", 20_000, "2026-11-02")] });
    expect(out).toHaveLength(1);
    expect(out[0]?.amount).toBe(20_000);
  });

  it("skips a payment whose booking was not loaded and handles a free stay without dividing by zero", () => {
    const out = collectedIncomes({ incomes: [], bookings: [booking({ amount: 0, nights: 2 })], payments: [pay("x", 5_000, "2026-11-02", "missing"), pay("y", 5_000, "2026-11-03")] });
    expect(out.map((r) => r.id)).toEqual(["pay-y"]);
    expect(out[0]?.nights).toBe(0);
  });
});
