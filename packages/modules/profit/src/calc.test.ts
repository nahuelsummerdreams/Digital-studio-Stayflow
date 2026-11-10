import { describe, expect, it } from "vitest";
import {
  breakEvenNights,
  monthlyComparison,
  netProfit,
  occupancyPct,
  profitByProperty,
  projectNet,
  suggestedNightlyRate,
} from "./calc";
import { parseMoney } from "./money";
import type { Expense, Income } from "./types";

const incomes: Income[] = [
  { propertyId: "a", amount: 100_000, nights: 4, date: "2026-01-10" },
  { propertyId: "a", amount: 50_000, nights: 2, date: "2026-02-05" },
  { propertyId: "b", amount: 80_000, nights: 3, date: "2026-01-20" },
];
const expenses: Expense[] = [
  { propertyId: "a", amount: 20_000, date: "2026-01-11" },
  { propertyId: null, amount: 10_001, date: "2026-01-31" }, // odd cents on purpose
  { propertyId: "b", amount: 5_000, date: "2026-02-02" },
];

describe("netProfit", () => {
  it("subtracts all expenses from all income", () => {
    expect(netProfit(incomes, expenses)).toBe(230_000 - 35_001);
  });
});

describe("profitByProperty", () => {
  const result = profitByProperty(["a", "b"], incomes, expenses);
  it("splits shared costs and never loses a cent", () => {
    expect(result.reduce((s, r) => s + r.net, 0)).toBe(netProfit(incomes, expenses));
  });
  it("computes margin", () => {
    const a = result.find((r) => r.propertyId === "a")!;
    expect(a.revenue).toBe(150_000);
    expect(a.nights).toBe(6);
    expect(a.marginPct).toBeGreaterThan(0);
  });
  it("handles no properties", () => {
    expect(profitByProperty([], incomes, expenses)).toEqual([]);
  });
});

describe("monthlyComparison", () => {
  it("groups and sorts by month", () => {
    const m = monthlyComparison(incomes, expenses);
    expect(m.map((x) => x.month)).toEqual(["2026-01", "2026-02"]);
    expect(m[0]!.net).toBe(180_000 - 30_001);
  });
});

describe("breakEvenNights", () => {
  it("rounds up nights to cover fixed costs", () => {
    // contribution = 10000 - 300 - 2000 = 7700 ; 100000/7700 = 12.98 -> 13
    expect(
      breakEvenNights({ fixedCostsMonthly: 100_000, nightlyRate: 10_000, variableCostPerNight: 2_000, platformCommissionPct: 3 }),
    ).toBe(13);
  });
  it("returns null when every night loses money", () => {
    expect(
      breakEvenNights({ fixedCostsMonthly: 100_000, nightlyRate: 2_000, variableCostPerNight: 2_500, platformCommissionPct: 3 }),
    ).toBeNull();
  });
});

describe("suggestedNightlyRate", () => {
  it("reaches the target profit after commission", () => {
    const rate = suggestedNightlyRate({
      fixedCostsMonthly: 100_000,
      variableCostPerNight: 2_000,
      targetProfitMonthly: 50_000,
      expectedNightsMonthly: 15,
      platformCommissionPct: 3,
    })!;
    const nightlyNet = rate - Math.round(rate * 0.03) - 2_000;
    expect(nightlyNet * 15 - 100_000).toBeGreaterThanOrEqual(50_000 - 15); // rounding tolerance
  });
  it("rejects impossible inputs", () => {
    expect(suggestedNightlyRate({ fixedCostsMonthly: 1, variableCostPerNight: 0, targetProfitMonthly: 0, expectedNightsMonthly: 0, platformCommissionPct: 3 })).toBeNull();
    expect(suggestedNightlyRate({ fixedCostsMonthly: 1, variableCostPerNight: 0, targetProfitMonthly: 0, expectedNightsMonthly: 5, platformCommissionPct: 100 })).toBeNull();
  });
});

describe("misc", () => {
  it("occupancy is capped at 100", () => {
    expect(occupancyPct(40, 30)).toBe(100);
    expect(occupancyPct(15, 30)).toBe(50);
  });
  it("projects the average of recent months", () => {
    const hist = monthlyComparison(incomes, expenses);
    expect(projectNet(hist, 2)).toHaveLength(2);
    expect(projectNet([], 2)).toEqual([0, 0]);
  });
  it("parses money input", () => {
    expect(parseMoney("1,250.50")).toBe(125_050);
    expect(parseMoney("abc")).toBeNull();
  });
});
