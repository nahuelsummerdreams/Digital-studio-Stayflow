import { describe, expect, it } from "vitest";
import { addDays, weekStart } from "./dates";
import { monthHalfSegments, rangeHalfSegments } from "./logic";
import type { Booking } from "./types";

let n = 0;
const bk = (over: Partial<Booking>): Booking => ({
  id: `w${++n}`, propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2,
  checkIn: "2026-11-18", checkOut: "2026-11-21", nights: 3, source: "direct", status: "confirmed", amount: 60_000, notes: "", createdAt: "2026-11-01T10:00:00Z",
  paid: 0, kind: "stay", externalUid: null, ...over,
});

describe("weekStart", () => {
  it("returns the Monday of the week, also when the day already is Monday or Sunday", () => {
    expect(weekStart("2026-11-18")).toBe("2026-11-16"); // Wednesday
    expect(weekStart("2026-11-16")).toBe("2026-11-16"); // Monday
    expect(weekStart("2026-11-22")).toBe("2026-11-16"); // Sunday belongs to the week that started Monday
    expect(weekStart("2026-11-23")).toBe("2026-11-23");
    expect(weekStart("2027-01-01")).toBe("2026-12-28"); // across the year boundary
  });
});

describe("rangeHalfSegments (a week)", () => {
  const FROM = "2026-11-16"; // Monday

  it("places a stay from the second half of check-in to the first half of check-out", () => {
    const [s] = rangeHalfSegments([bk({})], "p1", FROM, 7);
    // Wed 18 is day index 2: first half = slot 4, second half = slot 5. Check-out Sat 21 is index 5: first half = slot 10, so the bar ends at slot 11.
    expect(s).toMatchObject({ startHalf: 5, spanHalves: 6, startsBefore: false, endsAfter: false });
  });

  it("cuts a stay that began before the week and one that ends after it", () => {
    const [a] = rangeHalfSegments([bk({ checkIn: "2026-11-12", checkOut: "2026-11-18", nights: 6 })], "p1", FROM, 7);
    expect(a).toMatchObject({ startHalf: 0, startsBefore: true, endsAfter: false });
    expect(a!.startHalf + a!.spanHalves).toBe(5); // leaves in the first half of Wed 18 (slot 4) so it ends before slot 5
    const [b] = rangeHalfSegments([bk({ checkIn: "2026-11-21", checkOut: "2026-11-28", nights: 7 })], "p1", FROM, 7);
    expect(b).toMatchObject({ startsBefore: false, endsAfter: true });
    expect(b!.startHalf + b!.spanHalves).toBe(14);
  });

  it("ignores other properties, canceled stays and stays outside the week, and keeps blocks", () => {
    const list = [
      bk({ propertyId: "p2" }),
      bk({ status: "canceled" }),
      bk({ checkIn: "2026-11-23", checkOut: "2026-11-26" }),
      bk({ checkIn: "2026-11-09", checkOut: "2026-11-16" }), // leaves the first morning: no half-slot inside the week is covered
      bk({ kind: "block", guestName: "Arreglo", checkIn: "2026-11-17", checkOut: "2026-11-19", status: "confirmed" }),
    ];
    const segs = rangeHalfSegments(list, "p1", FROM, 7);
    expect(segs.map((s) => [s.label, s.kind])).toEqual([["Arreglo", "block"]]);
  });

  it("gives the same result as the monthly view when the range is the whole month", () => {
    const list = [bk({ checkIn: "2026-11-02", checkOut: "2026-11-06" }), bk({ checkIn: "2026-10-28", checkOut: "2026-11-03", nights: 6 }), bk({ checkIn: "2026-11-29", checkOut: "2026-12-04", nights: 5 })];
    expect(rangeHalfSegments(list, "p1", "2026-11-01", 30)).toEqual(monthHalfSegments(list, "p1", 2026, 11));
  });

  it("works when the week spans two months", () => {
    const [s] = rangeHalfSegments([bk({ checkIn: "2026-11-30", checkOut: "2026-12-03", nights: 3 })], "p1", "2026-11-30", 7);
    expect(s).toMatchObject({ startHalf: 1, spanHalves: 6 });
    expect(addDays("2026-11-30", 7)).toBe("2026-12-07");
  });
});
