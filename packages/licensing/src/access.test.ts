import { describe, expect, it } from "vitest";
import { hasProductAccess, limitsFor, unlockedProducts } from "./access";
import type { License } from "./catalog";

const NOW = new Date("2026-06-15T00:00:00Z");
const lic = (over: Partial<License>): License => ({
  product: "profit",
  plan: "starter",
  status: "active",
  currentPeriodEnd: new Date("2026-07-15T00:00:00Z"),
  ...over,
});

describe("hasProductAccess", () => {
  it("grants the purchased product only", () => {
    expect(hasProductAccess([lic({})], "profit", NOW)).toBe(true);
    expect(hasProductAccess([lic({})], "guest", NOW)).toBe(false);
  });

  it("suite unlocks every module", () => {
    const suite = [lic({ product: "suite", plan: "business" })];
    expect(hasProductAccess(suite, "guest", NOW)).toBe(true);
    expect(unlockedProducts(suite, NOW)).toHaveLength(8);
  });

  it("rejects canceled and expired licenses", () => {
    expect(hasProductAccess([lic({ status: "canceled" })], "profit", NOW)).toBe(false);
    expect(hasProductAccess([lic({ currentPeriodEnd: new Date("2026-06-01T00:00:00Z") })], "profit", NOW)).toBe(false);
  });

  it("keeps past_due working (grace period) and open-ended trials", () => {
    expect(hasProductAccess([lic({ status: "past_due" })], "profit", NOW)).toBe(true);
    expect(hasProductAccess([lic({ status: "trialing", currentPeriodEnd: null })], "profit", NOW)).toBe(true);
  });
});

describe("limitsFor", () => {
  it("returns null without a license", () => {
    expect(limitsFor([], "profit", NOW)).toBeNull();
  });
  it("takes the most generous limits across overlapping licenses", () => {
    const limits = limitsFor([lic({ plan: "starter" }), lic({ product: "suite", plan: "business" })], "profit", NOW);
    expect(limits?.properties).toBe(Infinity);
  });
});
