import { describe, expect, it } from "vitest";
import { averageOccupancy, monthlyMoney, occupancyNext } from "./homeCharts";
import type { Booking } from "./types";

let n = 0;
const bk = (over: Partial<Booking>): Booking => ({
  id: `b${++n}`, propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2,
  checkIn: "2026-11-20", checkOut: "2026-11-24", nights: 4, source: "direct", status: "confirmed", amount: 100_000, notes: "", createdAt: "2026-11-01T10:00:00Z", paid: 0, kind: "stay", externalUid: null, ...over,
});

const TODAY = "2026-11-18";

describe("monthlyMoney", () => {
  it("returns the last six months oldest first, crossing the year, with zeros where nothing happened", () => {
    const m = monthlyMoney([], [], "2026-02-10", 6);
    expect(m.map((x) => `${x.year}-${x.month}`)).toEqual(["2025-9", "2025-10", "2025-11", "2025-12", "2026-1", "2026-2"]);
    expect(m.every((x) => x.collected === 0 && x.expenses === 0)).toBe(true);
  });

  it("adds each amount to the month of its own date and ignores what falls outside the window", () => {
    const m = monthlyMoney(
      [{ amount: 100, date: "2026-11-02" }, { amount: 50, date: "2026-11-30" }, { amount: 70, date: "2026-10-15" }, { amount: 999, date: "2025-01-01" }],
      [{ amount: 20, date: "2026-11-10" }, { amount: 5, date: "2026-09-01" }],
      TODAY,
      6,
    );
    expect(m).toHaveLength(6);
    const nov = m[5]!;
    expect(nov).toMatchObject({ year: 2026, month: 11, collected: 150, expenses: 20 });
    expect(m[4]).toMatchObject({ month: 10, collected: 70, expenses: 0 });
    expect(m[3]).toMatchObject({ month: 9, expenses: 5 });
    expect(m.reduce((s, x) => s + x.collected, 0)).toBe(220);
  });
});

describe("occupancyNext", () => {
  it("counts a night when a live stay covers it, check-out day excluded", () => {
    const days = occupancyNext([bk({ checkIn: "2026-11-18", checkOut: "2026-11-20" })], 2, TODAY, 4);
    expect(days.map((d) => d.busy)).toEqual([1, 1, 0, 0]);
    expect(days.map((d) => d.pct)).toEqual([50, 50, 0, 0]);
    expect(days[0]!.date).toBe("2026-11-18");
    expect(days[3]!.date).toBe("2026-11-21");
  });

  it("ignores canceled stays and blocks, and counts a property once even with two stays", () => {
    const days = occupancyNext(
      [
        bk({ propertyId: "p1", status: "canceled", checkIn: "2026-11-18", checkOut: "2026-11-25" }),
        bk({ propertyId: "p1", kind: "block", checkIn: "2026-11-18", checkOut: "2026-11-25" }),
        bk({ propertyId: "p2", checkIn: "2026-11-18", checkOut: "2026-11-25" }),
        bk({ propertyId: "p2", checkIn: "2026-11-18", checkOut: "2026-11-19" }),
      ],
      2,
      TODAY,
      2,
    );
    expect(days.map((d) => d.busy)).toEqual([1, 1]);
  });

  it("is zero with no properties, and never above 100", () => {
    expect(occupancyNext([bk({})], 0, TODAY, 3).every((d) => d.pct === 0)).toBe(true);
    const over = occupancyNext([bk({ propertyId: "p1", checkIn: "2026-11-18" }), bk({ propertyId: "p2", checkIn: "2026-11-18" })], 1, TODAY, 1);
    expect(over[0]!.pct).toBe(100);
  });

  it("averages the days, rounded", () => {
    expect(averageOccupancy([{ date: "a", busy: 1, pct: 50 }, { date: "b", busy: 0, pct: 0 }, { date: "c", busy: 1, pct: 33 }])).toBe(28);
    expect(averageOccupancy([])).toBe(0);
  });
});
