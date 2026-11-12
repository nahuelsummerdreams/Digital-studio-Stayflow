import { describe, expect, it } from "vitest";
import { detectDateOrder, matchProperty, parseAmount, parseCsv, parseDate, readReservations } from "./importer";

describe("parseAmount", () => {
  it.each([
    ["$1,234.50", 123450],
    ["USD 120", 12000],
    ["1.234,50", 123450],
    ["1 234,5", 123450],
    ["1,234", 123400],
    ["99.5", 9950],
    ["€ 80,00", 8000],
  ])("%s", (raw, minor) => expect(parseAmount(raw)).toBe(minor));
  it("returns null when there is no number", () => expect(parseAmount("n/a")).toBeNull());
});

describe("dates", () => {
  it("reads ISO and both orders", () => {
    expect(parseDate("2026-10-09", "dmy")).toBe("2026-10-09");
    expect(parseDate("09/10/2026", "dmy")).toBe("2026-10-09");
    expect(parseDate("09/10/2026", "mdy")).toBe("2026-09-10");
    expect(parseDate("9/10/26", "dmy")).toBe("2026-10-09");
  });
  it("rejects impossible dates", () => expect(parseDate("31/02/2026", "dmy")).toBeNull());
  it("detects the order from the values", () => {
    expect(detectDateOrder(["25/10/2026"])).toEqual({ order: "dmy", ambiguous: false });
    expect(detectDateOrder(["10/25/2026"])).toEqual({ order: "mdy", ambiguous: false });
    expect(detectDateOrder(["03/04/2026"])).toEqual({ order: "dmy", ambiguous: true });
    expect(detectDateOrder(["2026-03-04"])).toEqual({ order: "dmy", ambiguous: false });
  });
});

describe("parseCsv", () => {
  it("handles quotes, commas inside, BOM and ; separators", () => {
    expect(parseCsv('﻿a;b\n"x;1";"he said ""hi"""\n')).toEqual([["a", "b"], ["x;1", 'he said "hi"']]);
    expect(parseCsv("a,b\r\n1,2\r\n\r\n3,4")).toEqual([["a", "b"], ["1", "2"], ["3", "4"]]);
  });
});

describe("readReservations", () => {
  const airbnb = [
    "Confirmation code,Status,Guest name,Contact,# of adults,# of children,Start date,End date,# of nights,Booked,Listing,Earnings",
    'HMABC123,Confirmed,Ana Pérez,+54 9 11 5555,2,1,10/25/2026,10/28/2026,3,10/01/2026,Casa del lago,"$1,200.00"',
    "HMDEF456,Canceled by guest,Luis Gómez,,2,0,11/02/2026,11/04/2026,2,10/05/2026,Casa del lago,$0.00",
    "HMBAD000,Confirmed,Sin fecha,,1,0,,,,,Casa del lago,$10.00",
  ].join("\n");
  it("reads an Airbnb export", () => {
    const r = readReservations(airbnb);
    expect(r.source).toBe("airbnb");
    expect(r.order).toBe("mdy");
    expect(r.ambiguous).toBe(false);
    expect(r.invalid).toBe(1);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toMatchObject({ code: "HMABC123", guest: "Ana Pérez", checkIn: "2026-10-25", checkOut: "2026-10-28", amount: 120000, guests: 3, canceled: false, listing: "Casa del lago" });
    expect(r.rows[1]?.canceled).toBe(true);
    expect(r.listings).toEqual(["Casa del lago"]);
  });
  it("reads a Spanish export with ; and day first", () => {
    const csv = "Código de confirmación;Nombre del huésped;Fecha de inicio;Fecha de finalización;Ingresos\nX1;Marta;25/10/2026;27/10/2026;USD 90,50";
    const r = readReservations(csv);
    expect(r.rows[0]).toMatchObject({ code: "X1", checkIn: "2026-10-25", checkOut: "2026-10-27", amount: 9050 });
  });
  it("reports missing columns instead of guessing", () => {
    expect(readReservations("a,b\n1,2").missing).toEqual(["start", "end"]);
  });
  it("builds a stable code when the file has none", () => {
    const r = readReservations("Guest name,Check-in,Check-out\nAna,2026-10-01,2026-10-03");
    expect(r.rows[0]?.code).toBe("2026-10-01_2026-10-03_ana");
  });
});

describe("matchProperty", () => {
  const props = [{ id: "a", name: "Casa del lago" }, { id: "b", name: "Depto Centro" }];
  it("matches exact, contained and unknown", () => {
    expect(matchProperty("casa del lago", props)).toBe("a");
    expect(matchProperty("Depto Centro - 2 amb", props)).toBe("b");
    expect(matchProperty("Cabaña", props)).toBeNull();
  });
});
