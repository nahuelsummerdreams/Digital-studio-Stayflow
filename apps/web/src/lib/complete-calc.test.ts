import { describe, expect, it } from "vitest";
import { monthlyCost, savingsAfter } from "./complete-calc";

describe("cost calculator", () => {
  it("adds up the monthly cost over the months, and treats bad input as nothing", () => {
    expect(monthlyCost(30, 12)).toBe(360);
    expect(monthlyCost(29.5, 12)).toBe(354);
    expect(monthlyCost(0, 12)).toBe(0);
    expect(monthlyCost(-10, 12)).toBe(0);
    expect(monthlyCost(Number.NaN, 12)).toBe(0);
    expect(monthlyCost(30, 0)).toBe(0);
  });

  it("the difference never goes below zero and uses the price that applies", () => {
    expect(savingsAfter(30, 12, 40)).toBe(320);
    expect(savingsAfter(30, 12, 89)).toBe(271);
    expect(savingsAfter(3, 12, 89)).toBe(0);
    expect(savingsAfter(0, 12, 40)).toBe(0);
    expect(savingsAfter(30, 12, -5)).toBe(360);
  });
});
