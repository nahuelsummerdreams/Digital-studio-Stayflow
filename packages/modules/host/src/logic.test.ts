import { describe, expect, it } from "vitest";
import { addDays, daysBetween, daysInMonth, firstOfNextMonth, localToday, shiftMonth } from "./dates";
import {
  bookedRevenue, guestsDirectory, monthSegments, movementsOn, nextStatuses, nightsWithin, occupancyPct, upcomingArrivals, validateBooking,
} from "./logic";
import type { Booking, NewBooking } from "./types";

let n = 0;
const bk = (over: Partial<Booking>): Booking => ({
  id: `b${++n}`, propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2,
  checkIn: "2026-11-10", checkOut: "2026-11-14", nights: 4, source: "airbnb", status: "confirmed", amount: 60_000, notes: "", ...over,
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
