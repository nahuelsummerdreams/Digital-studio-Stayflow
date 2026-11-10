import { describe, expect, it } from "vitest";
import { formatDate, formatMonth, formatMonthShort, formatPct, formatSignedPct } from "./format";

describe("format", () => {
  it("formats dates without shifting the day", () => {
    expect(formatDate("2026-11-10")).toBe("10 nov 2026");
    expect(formatDate("2026-01-01")).toBe("1 ene 2026");
  });
  it("capitalizes month names", () => {
    expect(formatMonth("2026-11")).toBe("Noviembre de 2026");
  });
  it("abbreviates months for chart labels", () => {
    expect(formatMonthShort("2026-06")).toBe("jun");
    expect(formatMonthShort("2026-09")).toMatch(/^sep/);
  });
  it("formats percentages with Spanish decimals", () => {
    expect(formatPct(64.8)).toBe("64,8");
    expect(formatSignedPct(12.5)).toBe("+12,5 %");
    expect(formatSignedPct(-8)).toBe("−8 %");
    expect(formatSignedPct(0)).toBe("0 %");
  });
});
