import { describe, expect, it } from "vitest";
import { averageDailyRate, bookableIds, establishmentTree, receptionDay } from "./lodging";
import type { Booking, HostProperty } from "./types";

const prop = (id: string, over: Partial<HostProperty> = {}): HostProperty => ({ id, name: id, ...over });
let n = 0;
const bk = (over: Partial<Booking>): Booking => ({
  id: `b${++n}`, propertyId: "r1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 1,
  checkIn: "2026-11-10", checkOut: "2026-11-12", nights: 2, source: "direct", status: "confirmed", amount: 20_000, notes: "", createdAt: "2026-11-01T10:00:00Z", paid: 0, kind: "stay", externalUid: null, ...over,
});

const hotel = [prop("h"), prop("r1", { parentId: "h", unitKind: "room" }), prop("r2", { parentId: "h", unitKind: "room" })];
const hostel = [
  prop("x"),
  prop("d1", { parentId: "x", unitKind: "room" }),
  prop("c1", { parentId: "d1", unitKind: "bed" }),
  prop("c2", { parentId: "d1", unitKind: "bed" }),
  prop("priv", { parentId: "x", unitKind: "room" }),
];

describe("establishmentTree", () => {
  it("groups rooms and beds under their establishment", () => {
    const t = establishmentTree(hostel);
    expect(t).toHaveLength(1);
    expect(t[0]!.rooms.map((r) => r.property.id)).toEqual(["d1", "priv"]);
    expect(t[0]!.rooms[0]!.beds.map((b) => b.id)).toEqual(["c1", "c2"]);
  });
});

describe("bookableIds", () => {
  it("rental: top-level properties only", () => {
    expect(bookableIds([prop("a"), prop("b")], "rental")).toEqual(["a", "b"]);
  });
  it("hotel: rooms, never the building", () => {
    expect(bookableIds(hotel, "hotel")).toEqual(["r1", "r2"]);
  });
  it("hostel: beds of shared rooms, the room itself when it has no beds", () => {
    expect(bookableIds(hostel, "hostel")).toEqual(["c1", "c2", "priv"]);
  });
});

describe("receptionDay", () => {
  it("counts arrivals, departures, in-house and occupancy per room", () => {
    const bookings = [
      bk({ propertyId: "r1", checkIn: "2026-11-10", checkOut: "2026-11-12" }),
      bk({ propertyId: "r2", checkIn: "2026-11-08", checkOut: "2026-11-11", nights: 3 }),
      bk({ propertyId: "r2", checkIn: "2026-11-11", checkOut: "2026-11-13", status: "canceled" }),
    ];
    const d = receptionDay(bookings, hotel, "hotel", "2026-11-11");
    expect(d.arrivals).toHaveLength(0);
    expect(d.departures).toHaveLength(1);
    expect(d.inHouse.map((b) => b.propertyId)).toEqual(["r1"]);
    expect(d.occupiedUnits).toBe(1);
    expect(d.totalUnits).toBe(2);
    expect(d.occupancyPct).toBe(50);
  });
  it("hostel counts each bed as a unit", () => {
    const bookings = [bk({ propertyId: "c1" }), bk({ propertyId: "c2" })];
    const d = receptionDay(bookings, hostel, "hostel", "2026-11-10");
    expect(d.arrivals).toHaveLength(2);
    expect(d.totalUnits).toBe(3);
    expect(d.occupiedUnits).toBe(2);
    expect(d.occupancyPct).toBeCloseTo(66.7, 1);
  });
  it("ignores blocks and bookings of other establishments", () => {
    const d = receptionDay([bk({ propertyId: "r1", kind: "block" }), bk({ propertyId: "other" })], hotel, "hotel", "2026-11-10");
    expect(d.inHouse).toHaveLength(0);
    expect(d.occupiedUnits).toBe(0);
  });
});

describe("averageDailyRate", () => {
  it("averages the nightly price actually booked", () => {
    const bookings = [bk({ propertyId: "r1", amount: 20_000, nights: 2 }), bk({ propertyId: "r2", amount: 30_000, nights: 2 })];
    expect(averageDailyRate(bookings, hotel, "hotel", "2026-11-10", "2026-11-12")).toBe(12_500);
  });
  it("is 0 with no stays", () => {
    expect(averageDailyRate([], hotel, "hotel", "2026-11-10", "2026-11-12")).toBe(0);
  });
});
