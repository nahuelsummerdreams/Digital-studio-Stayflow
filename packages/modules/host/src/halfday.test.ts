import { describe, expect, it } from "vitest";
import { buildDigest } from "./digest";
import { buildIcal, isBlockSummary, isPrivateAddress, parseIcal, planSync, sourceFromUrl } from "./ical";
import { monthHalfSegments, owed, paymentState, paymentTotals, pendingPayments, todayPlan, turnoverDays, validateBooking } from "./logic";
import { monthReport } from "./report";
import { DEFAULT_TEMPLATES, renderTemplate, whatsappUrl } from "./templates";
import type { Booking, HostTask } from "./types";

let n = 0;
const bk = (over: Partial<Booking>): Booking => ({
  id: `b${++n}`, propertyId: "p1", guestName: "Ana", guestEmail: "", guestPhone: "", guestsCount: 2,
  checkIn: "2026-10-09", checkOut: "2026-10-15", nights: 6, source: "airbnb", status: "confirmed", amount: 60_000, notes: "", createdAt: "2026-10-01T10:00:00Z",
  paid: 0, kind: "stay", externalUid: null, ...over,
});
const task = (over: Partial<HostTask>): HostTask => ({ id: `t${++n}`, propertyId: "p1", title: "Limpiar", dueOn: null, done: false, bookingId: null, assigneeId: null, priority: 1, ...over });

describe("half-day calendar", () => {
  it("a stay fills the 2nd half of check-in day through the 1st half of check-out day", () => {
    const [s] = monthHalfSegments([bk({})], "p1", 2026, 10);
    // day 9: first half = 16, second half = 17. Check-out day 15: first half = 28, so the bar ends before slot 29.
    expect(s).toMatchObject({ startHalf: 17, spanHalves: 12, startsBefore: false, endsAfter: false });
  });
  it("the next guest can take the 2nd half of the day the first one leaves", () => {
    const segs = monthHalfSegments([bk({}), bk({ checkIn: "2026-10-15", checkOut: "2026-10-18", nights: 3, guestName: "Beto" })], "p1", 2026, 10);
    expect(segs[0]!.startHalf + segs[0]!.spanHalves).toBe(29);
    expect(segs[1]!.startHalf).toBe(29);
  });
  it("clips stays that cross the month borders", () => {
    const [a] = monthHalfSegments([bk({ checkIn: "2026-09-28", checkOut: "2026-10-03", nights: 5 })], "p1", 2026, 10);
    expect(a).toMatchObject({ startHalf: 0, startsBefore: true, spanHalves: 5 });
    const [b] = monthHalfSegments([bk({ checkIn: "2026-10-29", checkOut: "2026-11-04", nights: 6 })], "p1", 2026, 10);
    expect(b).toMatchObject({ startHalf: 57, endsAfter: true, spanHalves: 62 - 57 });
  });
  it("ignores canceled stays and other properties; blocks are drawn", () => {
    const list = [bk({ status: "canceled" }), bk({ propertyId: "p2" }), bk({ kind: "block", guestName: "Pintura", checkIn: "2026-10-20", checkOut: "2026-10-22", nights: 2 })];
    const segs = monthHalfSegments(list, "p1", 2026, 10);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ kind: "block", label: "Pintura" });
  });
  it("finds same-day turnovers", () => {
    const list = [bk({}), bk({ checkIn: "2026-10-15", checkOut: "2026-10-18", nights: 3 })];
    expect(turnoverDays(list, "p1", "2026-10-01", "2026-11-01")).toEqual(["2026-10-15"]);
  });
  it("a block stops a booking over those dates but not back-to-back ones", () => {
    const block = bk({ kind: "block", checkIn: "2026-10-20", checkOut: "2026-10-22", nights: 2 });
    const input = { propertyId: "p1", guestName: "Z", guestEmail: "", guestPhone: "", guestsCount: 1, source: "direct" as const, amount: 0, notes: "" };
    expect(validateBooking({ ...input, checkIn: "2026-10-21", checkOut: "2026-10-24" }, [block])).toBe("host.errOverlap");
    expect(validateBooking({ ...input, checkIn: "2026-10-22", checkOut: "2026-10-24" }, [block])).toBeNull();
  });
});

describe("payments", () => {
  it("tracks what is owed", () => {
    expect(paymentState({ amount: 0, paid: 0 })).toBe("unpriced");
    expect(paymentState({ amount: 100, paid: 0 })).toBe("unpaid");
    expect(paymentState({ amount: 100, paid: 40 })).toBe("partial");
    expect(paymentState({ amount: 100, paid: 100 })).toBe("paid");
    expect(owed({ amount: 100, paid: 140 })).toBe(0);
  });
  it("lists pending payments soonest first and totals the month", () => {
    const list = [bk({ checkIn: "2026-10-20", checkOut: "2026-10-22", amount: 100, paid: 100 }), bk({ checkIn: "2026-10-12", checkOut: "2026-10-14", amount: 200, paid: 50 }), bk({ checkIn: "2026-10-03", checkOut: "2026-10-05", amount: 300, paid: 0 }), bk({ status: "canceled", amount: 999 })];
    expect(pendingPayments(list).map((b) => b.checkIn)).toEqual(["2026-10-03", "2026-10-12"]);
    expect(paymentTotals(list, "2026-10-01", "2026-11-01")).toMatchObject({ billed: 600, collected: 150, pending: 450 });
  });
});

describe("today", () => {
  it("gathers arrivals, departures, tasks and money to collect", () => {
    const list = [bk({ guestName: "Sale", checkIn: "2026-10-05", checkOut: "2026-10-10", status: "checked_in" }), bk({ guestName: "Llega", checkIn: "2026-10-10", checkOut: "2026-10-12", amount: 500, paid: 100 }), bk({ guestName: "Mañana", checkIn: "2026-10-11", checkOut: "2026-10-13" })];
    const plan = todayPlan(list, [task({ dueOn: "2026-10-10" }), task({ dueOn: "2026-10-01" }), task({ dueOn: "2026-10-10", done: true })], "2026-10-10");
    expect(plan.arrivals.map((b) => b.guestName)).toEqual(["Llega"]);
    expect(plan.departures.map((b) => b.guestName)).toEqual(["Sale"]);
    expect(plan.tomorrowArrivals.map((b) => b.guestName)).toEqual(["Mañana"]);
    expect(plan.tasks).toHaveLength(1);
    expect(plan.overdue).toHaveLength(1);
    expect(plan.collect.map((b) => b.guestName)).toEqual(["Llega", "Mañana"]);
  });
});

const ICS = [
  "BEGIN:VCALENDAR", "BEGIN:VEVENT", "UID:abc123@airbnb.com", "DTSTART;VALUE=DATE:20261109", "DTEND;VALUE=DATE:20261113", "SUMMARY:Reserved", "END:VEVENT",
  "BEGIN:VEVENT", "UID:blk1@booking.com", "DTSTART:20261201T000000Z", "DTEND:20261205T000000Z", "SUMMARY:CLOSED - Not available", "END:VEVENT",
  "BEGIN:VEVENT", "UID:bad", "DTSTART;VALUE=DATE:20261201", "DTEND;VALUE=DATE:20261201", "END:VEVENT", "END:VCALENDAR",
].join("\r\n");

describe("iCal", () => {
  it("parses events, handles date-time values and drops invalid ones", () => {
    const ev = parseIcal(ICS);
    expect(ev).toEqual([
      { uid: "abc123@airbnb.com", start: "2026-11-09", end: "2026-11-13", summary: "Reserved" },
      { uid: "blk1@booking.com", start: "2026-12-01", end: "2026-12-05", summary: "CLOSED - Not available" },
    ]);
  });
  it("unfolds long lines", () => {
    expect(parseIcal("BEGIN:VEVENT\r\nUID:x\r\nDTSTART;VALUE=DATE:20261109\r\nSUMMARY:Ana\r\n  Perez\r\nEND:VEVENT")[0]!.summary).toBe("Ana Perez");
  });
  it("tells holds from guests and detects the channel", () => {
    expect(isBlockSummary("Airbnb (Not available)")).toBe(true);
    expect(isBlockSummary("Reserved")).toBe(false);
    expect(sourceFromUrl("https://www.airbnb.com/calendar/ical/1.ics?s=x")).toBe("airbnb");
    expect(sourceFromUrl("https://admin.booking.com/hotel/hoteladmin/ical.html")).toBe("booking");
    expect(sourceFromUrl("nope")).toBe("other");
  });
  it("plans inserts, moves and cancellations, touching only imported bookings", () => {
    const events = parseIcal(ICS);
    const mine = bk({ guestName: "Manual", checkIn: "2026-11-20", checkOut: "2026-11-22" });
    const moved = bk({ externalUid: "abc123@airbnb.com", checkIn: "2026-11-09", checkOut: "2026-11-12", guestName: "Reserva Airbnb" });
    const gone = bk({ externalUid: "old@airbnb.com", checkIn: "2026-11-25", checkOut: "2026-11-27" });
    const plan = planSync([mine, moved, gone], events, "2026-11-01", "Reserva Airbnb");
    expect(plan.insert).toEqual([{ uid: "blk1@booking.com", start: "2026-12-01", end: "2026-12-05", name: "CLOSED - Not available", kind: "block" }]);
    expect(plan.update).toEqual([{ id: moved.id, start: "2026-11-09", end: "2026-11-13", name: "Reserva Airbnb", reopen: false }]);
    expect(plan.cancel).toEqual([{ id: gone.id }]);
  });
  it("builds a feed with dates only and no guest names", () => {
    const out = buildIcal("Casa", [{ uid: "u1", checkIn: "2026-11-09", checkOut: "2026-11-13", block: false }], new Date("2026-11-01T10:00:00Z"));
    expect(out).toContain("DTSTART;VALUE=DATE:20261109");
    expect(out).toContain("SUMMARY:Reservado");
    expect(out).toContain("\r\n");
    expect(parseIcal(out)[0]).toMatchObject({ start: "2026-11-09", end: "2026-11-13" });
  });
  it("refuses private and internal addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.5", "172.20.0.1", "169.254.169.254", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) expect(isPrivateAddress(ip)).toBe(true);
    for (const ip of ["8.8.8.8", "52.1.2.3", "2606:4700::1111"]) expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe("templates", () => {
  const ctx = { booking: bk({ guestName: "María José Pérez" }), propertyName: "Casa del Árbol", guideUrl: "https://guest.test/g/abc" };
  it("fills the variables with the first name and short dates", () => {
    const out = renderTemplate(DEFAULT_TEMPLATES.arrival, ctx);
    expect(out).toContain("Hola María,");
    expect(out).toContain("Casa del Árbol");
    expect(out).toContain("https://guest.test/g/abc");
    expect(renderTemplate(DEFAULT_TEMPLATES.welcome, ctx)).toMatch(/9 oct.*15 oct.*6 noches/);
  });
  it("leaves unknown variables visible and builds share links", () => {
    expect(renderTemplate("Hola {nombre} {otra}", ctx)).toBe("Hola María {otra}");
    expect(whatsappUrl("+34 600 123 456", "Hola ñ")).toBe("https://wa.me/34600123456?text=Hola%20%C3%B1");
  });
});

describe("monthly report and morning digest", () => {
  const props = [{ id: "p1", name: "Casa" }, { id: "p2", name: "Villa" }];
  it("adds up each property and the whole month", () => {
    const list = [bk({ amount: 60_000, paid: 30_000 }), bk({ propertyId: "p2", checkIn: "2026-10-01", checkOut: "2026-10-03", nights: 2, amount: 20_000, paid: 20_000 })];
    const r = monthReport(list, props, 2026, 10);
    expect(r.rows[0]).toMatchObject({ nights: 6, billed: 60_000, collected: 30_000, pending: 30_000, avgNightly: 10_000 });
    expect(r.rows[0]!.occupancy).toBeCloseTo(19.4, 1);
    expect(r.totals).toMatchObject({ bookings: 2, nights: 8, billed: 80_000, pending: 30_000 });
  });
  it("writes the digest, and says when there is nothing to send", () => {
    const money = (m: number) => `$${m / 100}`;
    const d = buildDigest({ orgName: "Mi casa", bookings: [bk({ guestName: "Llega <b>", checkIn: "2026-10-10", checkOut: "2026-10-12", amount: 500, paid: 100 })], tasks: [], properties: props, today: "2026-10-10", money });
    expect(d.empty).toBe(false);
    expect(d.text).toContain("LLEGAN HOY");
    expect(d.text).toContain("falta $4");
    expect(d.html).toContain("Llega &lt;b&gt;");
    expect(buildDigest({ orgName: "x", bookings: [], tasks: [], properties: props, today: "2026-10-10", money }).empty).toBe(true);
  });
});
