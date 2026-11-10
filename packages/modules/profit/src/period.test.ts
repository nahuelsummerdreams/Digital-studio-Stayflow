import { describe, expect, it } from "vitest";
import { changePct, inRange, localToday, periodRange } from "./period";

describe("periodRange", () => {
  it("this month runs to today and compares the same days of last month", () => {
    expect(periodRange("this_month", "2026-11-10")).toEqual({
      current: { from: "2026-11-01", to: "2026-11-10" },
      previous: { from: "2026-10-01", to: "2026-10-10" },
    });
  });
  it("clamps the comparison day to a shorter previous month", () => {
    expect(periodRange("this_month", "2026-03-31").previous).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });
  it("crosses the year boundary in January", () => {
    expect(periodRange("this_month", "2026-01-15").previous).toEqual({ from: "2025-12-01", to: "2025-12-15" });
    expect(periodRange("last_month", "2026-01-15")).toEqual({
      current: { from: "2025-12-01", to: "2025-12-31" },
      previous: { from: "2025-11-01", to: "2025-11-30" },
    });
    expect(periodRange("last_month", "2026-02-10").previous).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });
  it("this year compares year to date, including leap day", () => {
    expect(periodRange("this_year", "2026-11-10")).toEqual({
      current: { from: "2026-01-01", to: "2026-11-10" },
      previous: { from: "2025-01-01", to: "2025-11-10" },
    });
    expect(periodRange("this_year", "2028-02-29").previous).toEqual({ from: "2027-01-01", to: "2027-02-28" });
  });
  it("all time has no limits", () => {
    expect(periodRange("all", "2026-11-10")).toEqual({ current: null, previous: null });
  });
});

describe("helpers", () => {
  it("inRange is inclusive and open when null", () => {
    const r = { from: "2026-11-01", to: "2026-11-10" };
    expect(inRange("2026-11-01", r)).toBe(true);
    expect(inRange("2026-11-10", r)).toBe(true);
    expect(inRange("2026-11-11", r)).toBe(false);
    expect(inRange("1999-01-01", null)).toBe(true);
  });
  it("changePct handles growth, drops, negative bases and no base", () => {
    expect(changePct(150, 100)).toBe(50);
    expect(changePct(50, 100)).toBe(-50);
    expect(changePct(100, -100)).toBe(200);
    expect(changePct(100, 0)).toBeNull();
  });
  it("localToday uses the local calendar", () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
