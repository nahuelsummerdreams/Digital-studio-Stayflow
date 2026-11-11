import { describe, expect, it } from "vitest";
import { entriesCsv } from "./csv";

const H = { date: "Fecha", type: "Tipo", property: "Propiedad", detail: "Detalle", amount: "Importe", income: "Ingreso", expense: "Gasto" };

describe("entriesCsv", () => {
  it("uses ; separators, decimal comma, a BOM and negative expenses", () => {
    const out = entriesCsv([{ date: "2026-11-02", kind: "expense", property: "Casa", detail: "Limpieza", amount: 4550 }, { date: "2026-11-01", kind: "income", property: "Casa", detail: "Airbnb · 3 noches", amount: 120000 }], H);
    expect(out.charCodeAt(0)).toBe(0xfeff);
    expect(out.split("\r\n")).toEqual(["﻿Fecha;Tipo;Propiedad;Detalle;Importe", "2026-11-01;Ingreso;Casa;Airbnb · 3 noches;1200,00", "2026-11-02;Gasto;Casa;Limpieza;-45,50", ""]);
  });
  it("quotes separators and neutralises formulas", () => {
    const out = entriesCsv([{ date: "2026-11-01", kind: "expense", property: "=HYPERLINK(\"x\")", detail: "a;b \"c\"", amount: 100 }], H);
    expect(out).toContain("'=HYPERLINK");
    expect(out).toContain('"a;b ""c"""');
  });
});
