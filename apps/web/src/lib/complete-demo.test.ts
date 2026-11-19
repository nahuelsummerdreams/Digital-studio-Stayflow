import { describe, expect, it } from "vitest";
import { addBooking, canBook, DEMO_BOOKINGS, nextPayment, nextToPay, owedOf, registerPayment, statusOf, totalOwed } from "./complete-demo";

describe("COMPLETE demo", () => {
  it("starts with money still to collect, and totals what is owed", () => {
    expect(totalOwed(DEMO_BOOKINGS)).toBe(840 + 650 + 700);
    expect(owedOf(DEMO_BOOKINGS[1]!)).toBe(0);
  });

  it("tells paid, partial and pending apart", () => {
    expect(statusOf({ total: 100, paid: 100 })).toBe("paid");
    expect(statusOf({ total: 100, paid: 30 })).toBe("partial");
    expect(statusOf({ total: 100, paid: 0 })).toBe("pending");
  });

  it("registers a payment without ever passing the total and without touching the others", () => {
    const after = registerPayment(DEMO_BOOKINGS, "c", 250);
    expect(after.find((b) => b.id === "c")?.paid).toBe(250);
    expect(after.find((b) => b.id === "a")?.paid).toBe(360);
    expect(registerPayment(DEMO_BOOKINGS, "c", 99_999).find((b) => b.id === "c")?.paid).toBe(650);
    expect(registerPayment(DEMO_BOOKINGS, "c", -5)).toEqual(DEMO_BOOKINGS);
    expect(registerPayment(DEMO_BOOKINGS, "zzz", 50)).toEqual(DEMO_BOOKINGS);
  });

  it("the next payment is the 30% deposit first, then the rest", () => {
    expect(nextPayment({ total: 650, paid: 0 })).toBe(200);
    expect(nextPayment({ total: 650, paid: 200 })).toBe(450);
    expect(nextPayment({ total: 650, paid: 650 })).toBe(0);
  });

  it("walks through everyone who still owes, then stops, and the total reaches zero", () => {
    let list = [...DEMO_BOOKINGS];
    let last: string | undefined;
    for (let i = 0; i < 12; i++) {
      const b = nextToPay(list, last);
      if (!b) break;
      list = registerPayment(list, b.id, nextPayment(b));
      last = b.id;
    }
    expect(totalOwed(list)).toBe(0);
    expect(nextToPay(list, last)).toBeUndefined();
  });

  it("lets you book a free day, and refuses to put a stay on top of another one or outside the week", () => {
    expect(canBook(DEMO_BOOKINGS, 0, 4, 1)).toBe(true);
    expect(canBook(DEMO_BOOKINGS, 0, 3, 2)).toBe(false);
    expect(canBook(DEMO_BOOKINGS, 1, 4, 2)).toBe(true);
    expect(canBook(DEMO_BOOKINGS, 1, 3, 2)).toBe(false);
    expect(canBook(DEMO_BOOKINGS, 2, 0, 2)).toBe(true);
    expect(canBook(DEMO_BOOKINGS, 0, 6, 2)).toBe(false);
    expect(canBook(DEMO_BOOKINGS, 0, -1, 1)).toBe(false);
    const added = addBooking(DEMO_BOOKINGS, { id: "n1", guest: "Nueva reserva", place: "Casa del Lago", row: 0, start: 4, len: 1, total: 300, paid: 0 });
    expect(added).toHaveLength(DEMO_BOOKINGS.length + 1);
    expect(addBooking(added, { id: "n2", guest: "x", place: "y", row: 0, start: 4, len: 1, total: 1, paid: 0 })).toHaveLength(added.length);
  });
});
