import { describe, expect, it } from "vitest";
import { addDays, daysBetween, daysInMonth, firstOfNextMonth, localToday, shiftMonth } from "./dates";
import {
  bookedRevenue, guestKeyOf, guestSegments, guestStays, guestsDirectory, parseTags, monthSegments, movementsOn, nextStatuses, nightsWithin, occupancyPct, upcomingArrivals, validateBooking,
} from "./logic";
import type { Booking, NewBooking } from "./types";

let n = 0;
const bk = (over: Partial<Booking>): Booking => ({
  id: `b${++n}`, propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2,
  checkIn: "2026-11-10", checkOut: "2026-11-14", nights: 4, source: "airbnb", status: "confirmed", amount: 60_000, notes: "", createdAt: "2026-11-01T10:00:00Z", paid: 0, kind: "stay", externalUid: null, ...over,
});

describe("dates", () => {
  it("adds days across month and year boundaries and leap years", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2026-11-10", "2026-11-14")).toBe(4);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(firstOfNextMonth(2026, 12)).toBe("2027-01-01");
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
  it("uses the local calendar day", () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("occupancy", () => {
  it("counts only the nights inside the window", () => {
    const b = bk({ checkIn: "2026-10-29", checkOut: "2026-11-03" });
    expect(nightsWithin(b, "2026-11-01", "2026-12-01")).toBe(2);
    expect(nightsWithin(b, "2026-12-01", "2027-01-01")).toBe(0);
  });
  it("is booked nights over available nights, per property count", () => {
    const list = [bk({ checkIn: "2026-11-01", checkOut: "2026-11-16" })]; // 15 nights of 30
    expect(occupancyPct(list, ["p1"], "2026-11-01", "2026-12-01")).toBe(50);
    expect(occupancyPct(list, ["p1", "p2"], "2026-11-01", "2026-12-01")).toBe(25);
  });
  it("ignores canceled bookings and handles no properties", () => {
    expect(occupancyPct([bk({ status: "canceled" })], ["p1"], "2026-11-01", "2026-12-01")).toBe(0);
    expect(occupancyPct([bk({})], [], "2026-11-01", "2026-12-01")).toBe(0);
  });
});

describe("daily view", () => {
  const list = [
    bk({ id: "a", guestName: "Ana", checkIn: "2026-11-10", checkOut: "2026-11-12" }),
    bk({ id: "b", guestName: "Beto", propertyId: "p2", checkIn: "2026-11-08", checkOut: "2026-11-10" }),
    bk({ id: "c", guestName: "Cris", checkIn: "2026-11-10", checkOut: "2026-11-11", status: "canceled" }),
    bk({ id: "d", guestName: "Dani", propertyId: "p2", checkIn: "2026-11-20", checkOut: "2026-11-22" }),
  ];
  it("lists arrivals and departures, never canceled ones", () => {
    const m = movementsOn(list, "2026-11-10");
    expect(m.arrivals.map((x) => x.id)).toEqual(["a"]);
    expect(m.departures.map((x) => x.id)).toEqual(["b"]);
  });
  it("lists upcoming confirmed arrivals within the window, soonest first", () => {
    expect(upcomingArrivals(list, "2026-11-10", 7).map((x) => x.id)).toEqual(["a"]);
    expect(upcomingArrivals(list, "2026-11-10", 14).map((x) => x.id)).toEqual(["a", "d"]);
  });
  it("sums booked revenue by check-in month without canceled", () => {
    expect(bookedRevenue(list, "2026-11-01", "2026-12-01")).toBe(180_000);
  });
});

describe("calendar segments", () => {
  it("clips stays to the month and flags continuations", () => {
    const stay = bk({ id: "s", checkIn: "2026-10-28", checkOut: "2026-11-03" });
    const [seg] = monthSegments([stay], "p1", 2026, 11);
    expect(seg).toMatchObject({ startDay: 1, span: 2, startsBefore: true, endsAfter: false });
    const [oct] = monthSegments([stay], "p1", 2026, 10);
    expect(oct).toMatchObject({ startDay: 28, span: 4, startsBefore: false, endsAfter: true });
  });
  it("skips other properties, other months and canceled stays", () => {
    const list = [bk({ propertyId: "p2" }), bk({ checkIn: "2026-12-05", checkOut: "2026-12-08" }), bk({ status: "canceled" })];
    expect(monthSegments(list, "p1", 2026, 11)).toEqual([]);
  });
  it("a stay ending on the 1st does not appear in the new month", () => {
    expect(monthSegments([bk({ checkIn: "2026-10-30", checkOut: "2026-11-01" })], "p1", 2026, 11)).toEqual([]);
  });
});

describe("guest directory", () => {
  it("merges the same person across stays and keeps the latest contact data", () => {
    const g = guestsDirectory([
      bk({ guestName: "Ana Pérez", guestEmail: "ANA@mail.com", checkIn: "2026-06-01", checkOut: "2026-06-04", nights: 3, amount: 30_000 }),
      bk({ guestName: "Ana P.", guestEmail: "ana@mail.com", guestPhone: "+34600", checkIn: "2026-09-01", checkOut: "2026-09-06", nights: 5, amount: 50_000 }),
      bk({ guestName: "Luis", checkIn: "2026-07-01", checkOut: "2026-07-02", nights: 1, amount: 10_000 }),
    ]);
    expect(g).toHaveLength(2);
    expect(g[0]).toMatchObject({ stays: 2, nights: 8, spent: 80_000, phone: "+34600", lastStay: "2026-09-06" });
  });
  it("ignores canceled stays", () => {
    expect(guestsDirectory([bk({ status: "canceled" })])).toEqual([]);
  });
});

describe("status flow and validation", () => {
  it("allows only sensible next steps", () => {
    expect(nextStatuses("confirmed")).toEqual(["checked_in", "canceled"]);
    expect(nextStatuses("checked_in")).toEqual(["checked_out"]);
    expect(nextStatuses("checked_out")).toEqual([]);
    expect(nextStatuses("canceled")).toEqual([]);
    expect(nextStatuses("inquiry")).toEqual(["pending", "confirmed", "canceled"]);
    expect(nextStatuses("pending")).toEqual(["confirmed", "canceled"]);
  });
  const base: NewBooking = { propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2, checkIn: "2026-12-01", checkOut: "2026-12-05", source: "direct", amount: 0, notes: "" };
  it("accepts a valid booking and rejects broken ones", () => {
    expect(validateBooking(base, [])).toBeNull();
    expect(validateBooking({ ...base, guestName: "  " }, [])).toBe("host.errName");
    expect(validateBooking({ ...base, checkOut: "2026-12-01" }, [])).toBe("host.errDates");
    expect(validateBooking({ ...base, checkOut: "2028-01-01" }, [])).toBe("host.errLong");
    expect(validateBooking({ ...base, amount: -1 }, [])).toBe("host.errAmount");
  });
  it("detects overlaps but allows back-to-back and other properties", () => {
    const existing = [bk({ propertyId: "p1", checkIn: "2026-12-05", checkOut: "2026-12-08" })];
    expect(validateBooking({ ...base, checkOut: "2026-12-06" }, existing)).toBe("host.errOverlap");
    expect(validateBooking(base, existing)).toBeNull();
    expect(validateBooking({ ...base, propertyId: "p2", checkOut: "2026-12-06" }, existing)).toBeNull();
    expect(validateBooking({ ...base, checkOut: "2026-12-06" }, [bk({ ...existing[0]!, status: "canceled" })])).toBeNull();
  });
});

import { changePct, hostAlerts, monthlyOccupancy, propertyState, sourceBreakdown, weekOf } from "./insights";

describe("insights", () => {
  const mk = (over: Partial<Booking>): Booking => ({
    id: "x", propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2,
    checkIn: "2026-11-10", checkOut: "2026-11-14", nights: 4, source: "airbnb", status: "confirmed", amount: 10000, notes: "", createdAt: "2026-11-01T10:00:00Z", paid: 0, kind: "stay", externalUid: null, ...over,
  });

  it("changePct handles zero and normal cases", () => {
    expect(changePct(110, 100)).toBe(10);
    expect(changePct(50, 100)).toBe(-50);
    expect(changePct(0, 0)).toBe(0);
    expect(changePct(5, 0)).toBeNull();
  });

  it("monthlyOccupancy returns 12 months", () => {
    const occ = monthlyOccupancy([mk({ checkIn: "2026-11-01", checkOut: "2026-11-16" })], ["p1"], 2026);
    expect(occ).toHaveLength(12);
    expect(occ[10]).toBe(50);
    expect(occ[0]).toBe(0);
  });

  it("sourceBreakdown counts live bookings only", () => {
    const list = [mk({ id: "1" }), mk({ id: "2", source: "booking" }), mk({ id: "3", source: "booking" }), mk({ id: "4", status: "canceled" })];
    expect(sourceBreakdown(list, "2026-11-01", "2026-12-01")).toEqual([
      { source: "booking", count: 2 },
      { source: "airbnb", count: 1 },
    ]);
  });

  it("propertyState: occupied, arriving soon, free", () => {
    const b = mk({ checkIn: "2026-11-08", checkOut: "2026-11-12", status: "checked_in" });
    expect(propertyState([b], "p1", "2026-11-10").kind).toBe("occupied");
    const soon = mk({ checkIn: "2026-11-12", checkOut: "2026-11-15" });
    expect(propertyState([soon], "p1", "2026-11-10")).toMatchObject({ kind: "arriving", inDays: 2 });
    const far = mk({ checkIn: "2026-11-25", checkOut: "2026-11-28" });
    expect(propertyState([far], "p1", "2026-11-10")).toMatchObject({ kind: "free" });
    expect(propertyState([], "p1", "2026-11-10")).toEqual({ kind: "free", next: null });
  });

  it("hostAlerts flags overdue tasks, missed check-ins/outs and missing amounts", () => {
    const today = "2026-11-10";
    const alerts = hostAlerts(
      [
        mk({ id: "a", status: "checked_in", checkIn: "2026-11-01", checkOut: "2026-11-09" }),
        mk({ id: "b", status: "confirmed", checkIn: "2026-11-08", checkOut: "2026-11-12" }),
        mk({ id: "c", status: "confirmed", checkIn: "2026-11-20", checkOut: "2026-11-22", amount: 0 }),
        mk({ id: "d", status: "confirmed", checkIn: today, checkOut: "2026-11-12" }),
      ],
      [{ id: "t1", propertyId: null, title: "Sábanas", dueOn: "2026-11-08", done: false, bookingId: null }],
      today,
    );
    expect(alerts.map((x) => x.kind).sort()).toEqual(["arrivalPending", "arrivalsToday", "departurePending", "noAmount", "overdueTask"]);
    expect(alerts.find((x) => x.kind === "overdueTask")).toMatchObject({ daysLate: 2 });
  });

  it("weekOf starts on Monday", () => {
    const w = weekOf("2026-11-10"); // a Tuesday
    expect(w[0]).toBe("2026-11-09");
    expect(w[6]).toBe("2026-11-15");
    expect(weekOf("2026-11-10", 1)[0]).toBe("2026-11-16");
  });
});

describe("guest file", () => {
  const stay = (over: Partial<Booking>): Booking => bk({ guestName: "Ana", guestEmail: "ana@x.com", ...over });
  it("the identity is the email, or the name when there is none", () => {
    expect(guestKeyOf({ guestEmail: " Ana@X.com ", guestName: "Ana" })).toBe("ana@x.com");
    expect(guestKeyOf({ guestEmail: "", guestName: " Luis P " })).toBe("luis p");
  });
  it("lists the stays of one guest, newest first, canceled included", () => {
    const all = [stay({ id: "1", checkIn: "2026-01-01", checkOut: "2026-01-03" }), stay({ id: "2", checkIn: "2026-05-01", checkOut: "2026-05-03", status: "canceled" }), stay({ id: "3", guestEmail: "otra@x.com", guestName: "Otra" })];
    expect(guestStays(all, "ana@x.com").map((b) => b.id)).toEqual(["2", "1"]);
  });
  it("segments: vip, frequent, owes, incident", () => {
    const bookings = [stay({ id: "1", amount: 1000, paid: 1000 }), stay({ id: "2", amount: 1000, paid: 400, checkIn: "2026-06-01", checkOut: "2026-06-03" })];
    expect(guestSegments({ key: "ana@x.com", stays: 2 }, bookings, { vip: true }, new Set(["ana@x.com"]))).toEqual(["vip", "frequent", "owes", "incident"]);
    expect(guestSegments({ key: "ana@x.com", stays: 1 }, [stay({ amount: 1000, paid: 1000 })], undefined, new Set())).toEqual([]);
  });
  it("a canceled stay never makes a guest owe", () => {
    expect(guestSegments({ key: "ana@x.com", stays: 1 }, [stay({ amount: 1000, paid: 0, status: "canceled" })], undefined, new Set())).toEqual([]);
  });
  it("parses tags: trims, drops repeats and empties, caps at 10 of 30 characters", () => {
    expect(parseTags("familia, vip ,Familia,, ")).toEqual(["familia", "vip"]);
    expect(parseTags(Array.from({ length: 14 }, (_, i) => `t${i}`).join(","))).toHaveLength(10);
    expect(parseTags("x".repeat(40))[0]).toHaveLength(30);
  });
});

describe("inquiries and pending bookings", () => {
  const input: NewBooking = { propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2, checkIn: "2026-11-12", checkOut: "2026-11-15", source: "direct", amount: 0, notes: "" };
  it("an inquiry holds no dates; a pending booking does", () => {
    expect(validateBooking(input, [bk({ status: "inquiry" })])).toBeNull();
    expect(validateBooking(input, [bk({ status: "pending" })])).toBe("host.errOverlap");
  });
  it("an inquiry may overlap anything, but does not count in the numbers", () => {
    expect(validateBooking({ ...input, status: "inquiry" }, [bk({ status: "confirmed" })])).toBeNull();
    expect(bookedRevenue([bk({ status: "inquiry", amount: 99_000 })], "2026-11-01", "2026-12-01")).toBe(0);
  });
});
