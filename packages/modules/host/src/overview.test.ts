import { describe, expect, it } from "vitest";
import { nextDueOn, owedWhen, ownerOverview } from "./overview";
import type { Booking } from "./types";

let n = 0;
const bk = (over: Partial<Booking>): Booking => ({
  id: `b${++n}`, propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2,
  checkIn: "2026-11-20", checkOut: "2026-11-24", nights: 4, source: "direct", status: "confirmed", amount: 100_000, notes: "", createdAt: "2026-11-01T10:00:00Z", paid: 0, kind: "stay", externalUid: null, ...over,
});

const TODAY = "2026-11-18";

describe("ownerOverview: who still owes", () => {
  it("lists only live stays with a balance, nearest arrival first, and adds up the total", () => {
    const o = ownerOverview({
      today: TODAY, jobs: [], expenses: [],
      bookings: [
        bk({ guestName: "Lejos", checkIn: "2026-12-20", checkOut: "2026-12-22", amount: 50_000, paid: 10_000 }),
        bk({ guestName: "Pronto", checkIn: "2026-11-20", amount: 100_000, paid: 30_000 }),
        bk({ guestName: "Ya llegó", checkIn: "2026-11-16", checkOut: "2026-11-20", status: "checked_in", amount: 80_000, paid: 0 }),
        bk({ guestName: "Pagó todo", amount: 40_000, paid: 40_000 }),
        bk({ guestName: "Cancelada", status: "canceled", amount: 99_000, paid: 0 }),
        bk({ guestName: "Bloqueo", kind: "block", amount: 0 }),
      ],
    });
    expect(o.owedList.map((r) => r.booking.guestName)).toEqual(["Ya llegó", "Pronto", "Lejos"]);
    expect(o.owedList.map((r) => r.urgency)).toEqual(["overdue", "soon", "later"]);
    expect(o.owedList.map((r) => r.owed)).toEqual([80_000, 70_000, 40_000]);
    expect(o.owedTotal).toBe(190_000);
  });

  it("never reports a negative balance when a guest paid more than the total", () => {
    const o = ownerOverview({ today: TODAY, jobs: [], expenses: [], bookings: [bk({ amount: 10_000, paid: 15_000 })] });
    expect(o.owedList).toHaveLength(0);
    expect(o.owedTotal).toBe(0);
  });
});

describe("ownerOverview: the month", () => {
  it("counts what was collected (not billed) minus the month's expenses", () => {
    const o = ownerOverview({
      today: TODAY, jobs: [],
      bookings: [
        bk({ checkIn: "2026-11-05", checkOut: "2026-11-08", amount: 100_000, paid: 100_000 }),
        bk({ checkIn: "2026-11-25", checkOut: "2026-11-28", amount: 200_000, paid: 50_000 }),
        bk({ checkIn: "2026-12-02", checkOut: "2026-12-05", amount: 500_000, paid: 500_000 }),
      ],
      expenses: [{ amount: 30_000, date: "2026-11-10" }, { amount: 99_999, date: "2026-10-31" }],
    });
    expect(o.month).toEqual({ billed: 300_000, collected: 150_000, pending: 150_000, expenses: 30_000, result: 120_000 });
  });
});

describe("ownerOverview: today", () => {
  it("counts guests in the house, arrivals in the next 7 days, departures today and open jobs", () => {
    const o = ownerOverview({
      today: TODAY, expenses: [],
      bookings: [
        bk({ checkIn: "2026-11-16", checkOut: "2026-11-20", guestsCount: 3, status: "checked_in" }),
        bk({ checkIn: "2026-11-14", checkOut: "2026-11-18", guestsCount: 2, status: "checked_out" }),
        bk({ checkIn: "2026-11-22", checkOut: "2026-11-25" }),
        bk({ checkIn: "2026-12-10", checkOut: "2026-12-12" }),
      ],
      jobs: [
        { kind: "cleaning", status: "pending", dueOn: "2026-11-18" },
        { kind: "cleaning", status: "done", dueOn: "2026-11-17" },
        { kind: "maintenance", status: "in_progress", dueOn: "2026-11-15" },
      ],
    });
    expect(o.staying).toEqual({ stays: 1, guests: 3 });
    expect(o.arrivalsNext7).toBe(1);
    expect(o.departuresToday).toBe(1);
    expect(o.activeBookings).toBe(4);
    expect(o.jobs).toEqual({ cleaningOpen: 1, maintenanceOpen: 1, overdue: 1 });
  });
});

describe("owedWhen", () => {
  it("describes the arrival in plain terms", () => {
    expect(owedWhen(-3)).toEqual({ kind: "arrived", days: 3 });
    expect(owedWhen(0).kind).toBe("today");
    expect(owedWhen(1).kind).toBe("tomorrow");
    expect(owedWhen(9)).toEqual({ kind: "inDays", days: 9 });
  });
});

describe("payment due dates", () => {
  it("expects the deposit date while nothing is paid, then the balance date", () => {
    const base = { amount: 100_000, depositDueOn: "2026-11-10", balanceDueOn: "2026-11-19" };
    expect(nextDueOn({ ...base, paid: 0 })).toBe("2026-11-10");
    expect(nextDueOn({ ...base, paid: 30_000 })).toBe("2026-11-19");
    expect(nextDueOn({ ...base, paid: 100_000 })).toBeNull();
    expect(nextDueOn({ amount: 100_000, paid: 0, depositDueOn: null, balanceDueOn: "2026-11-19" })).toBe("2026-11-19");
    expect(nextDueOn({ amount: 100_000, paid: 0 })).toBeNull();
  });

  it("marks a payment as overdue once its date has passed, even before the guest arrives", () => {
    const o = ownerOverview({
      today: TODAY, jobs: [], expenses: [],
      bookings: [
        bk({ guestName: "Venció", checkIn: "2026-12-01", checkOut: "2026-12-04", amount: 100_000, paid: 20_000, balanceDueOn: "2026-11-15" }),
        bk({ guestName: "Vence pronto", checkIn: "2026-12-10", checkOut: "2026-12-12", amount: 50_000, paid: 0, depositDueOn: "2026-11-21" }),
        bk({ guestName: "Sin fecha", checkIn: "2026-12-30", checkOut: "2027-01-02", amount: 80_000, paid: 0 }),
      ],
    });
    expect(o.owedList.map((r) => [r.booking.guestName, r.urgency])).toEqual([["Venció", "overdue"], ["Vence pronto", "soon"], ["Sin fecha", "later"]]);
    expect(o.owedList[0]?.daysToDue).toBe(-3);
    expect(o.pastDue).toEqual({ count: 1, total: 80_000 });
  });

  it("does not count a payment as past due when no date was set", () => {
    const o = ownerOverview({ today: TODAY, jobs: [], expenses: [], bookings: [bk({ checkIn: "2026-11-16", checkOut: "2026-11-20", status: "checked_in", amount: 60_000, paid: 0 })] });
    expect(o.owedList[0]?.urgency).toBe("overdue");
    expect(o.pastDue).toEqual({ count: 0, total: 0 });
  });
});

describe("ownerOverview: collected from the finance ledger", () => {
  it("uses money received in the month (by payment date) when the ledger income is given, so Inicio and Finanzas agree", () => {
    const o = ownerOverview({
      today: TODAY, jobs: [],
      bookings: [bk({ checkIn: "2026-12-10", checkOut: "2026-12-14", amount: 100_000, paid: 100_000 })],
      expenses: [{ amount: 30_000, date: "2026-11-10" }],
      // The guest of a December stay paid in November: that cash belongs to November.
      collectedIncomes: [{ amount: 100_000, date: "2026-11-04" }, { amount: 5_000, date: "2026-10-30" }],
    });
    expect(o.month.collected).toBe(100_000);
    expect(o.month.result).toBe(70_000);
  });
});
