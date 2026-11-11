import { describe, expect, it } from "vitest";
import { computeTotals, normalizeApps, offers, packTotals, recommendations, supportTotal } from "./pricing";
import { SUPPORT_PRICE } from "./catalog";

describe("computeTotals", () => {
  it("an empty cart is zero and unlocks nothing", () => {
    const t = computeTotals({ apps: [], kit: false });
    expect(t).toMatchObject({ total: 0, discount: 0, discountActive: false, appsToUnlock: 0 });
  });

  it("one app pays full price and asks for one more", () => {
    const t = computeTotals({ apps: ["guest"], kit: false });
    expect(t).toMatchObject({ appsSubtotal: 49, discount: 0, total: 49, appsToUnlock: 1, discountActive: false });
  });

  it("two or more apps get exactly 30% off the apps subtotal", () => {
    const t = computeTotals({ apps: ["guest", "profit"], kit: false }); // 49 + 19 = 68
    expect(t).toMatchObject({ appsSubtotal: 68, discountActive: true, discount: 20.4, saved: 20.4, total: 47.6, appsToUnlock: 0 });
  });

  it("the discount is the same 30% from 2 up to all 9 apps", () => {
    for (let n = 2; n <= 9; n++) {
      const ids = ["host", "guest", "ai", "profit", "operations", "listing", "academy", "experiences", "website"].slice(0, n);
      const t = computeTotals({ apps: normalizeApps(ids), kit: false });
      expect(t.discountPercent).toBe(30);
      expect(t.total).toBeCloseTo(t.appsSubtotal * 0.7, 2);
    }
  });

  it("the Launch Kit is added at full price and is never discounted", () => {
    const t = computeTotals({ apps: ["guest", "profit"], kit: true });
    expect(t).toMatchObject({ kitPrice: 159, originalTotal: 227, discount: 20.4, total: 206.6 });
    const kitOnly = computeTotals({ apps: [], kit: true });
    expect(kitOnly).toMatchObject({ discountActive: false, total: 159, appCount: 0 });
  });

  it("an app plus the kit does not unlock the discount", () => {
    expect(computeTotals({ apps: ["profit"], kit: true })).toMatchObject({ discountActive: false, total: 178 });
  });

  it("ignores unknown ids and duplicates", () => {
    expect(normalizeApps(["profit", "profit", "nope", "guest"])).toEqual(["guest", "profit"]);
  });

  it("marks pre-order lines", () => {
    const t = computeTotals({ apps: ["guest", "ai"], kit: false });
    expect(t.lines.map((l) => [l.id, l.preorder])).toEqual([["guest", false], ["ai", true]]);
  });
});

describe("recommendations", () => {
  it("follows the cross-sell rules", () => {
    expect(recommendations(["guest"])).toEqual(["ai", "experiences"]);
    expect(recommendations(["profit"])).toEqual(["operations"]);
    expect(recommendations(["listing"])).toEqual(["website"]);
    expect(recommendations(["operations"])).toEqual(["profit", "ai"]);
    expect(recommendations(["website"])).toEqual(["experiences"]);
  });
  it("never suggests what is already in the cart", () => {
    expect(recommendations(["guest", "ai"])).toEqual(["experiences"]);
    expect(recommendations(["profit", "operations"])).toEqual(["ai"]);
  });
  it("is empty for an empty cart", () => {
    expect(recommendations([])).toEqual([]);
  });
});

describe("packs", () => {
  it("prices the ready-made packs with the 30% rule", () => {
    expect(packTotals("essential")).toMatchObject({ appsSubtotal: 117, discount: 35.1, total: 81.9 });
    expect(packTotals("pro")).toMatchObject({ appsSubtotal: 175, total: 122.5 });
    expect(packTotals("mega")).toMatchObject({ appCount: 9, appsSubtotal: 281, total: 196.7 });
  });
});

describe("offers (upsell and downsell)", () => {
  it("one app: suggests the cheapest other app, and it can even lower the price", () => {
    const [o] = offers({ apps: ["guest"], kit: false });
    expect(o).toMatchObject({ kind: "unlock", id: "profit" });
    expect((o as { extra: number }).extra).toBeLessThan(0); // 49 -> 47.60
  });
  it("two apps: suggests the smallest pack that contains them", () => {
    const o = offers({ apps: ["host", "profit"], kit: false });
    expect(o[0]).toMatchObject({ kind: "pack", pack: "essential", moreApps: 1 });
  });
  it("apps outside the packs jump to the megapack", () => {
    expect(offers({ apps: ["listing", "website"], kit: false })[0]).toMatchObject({ kind: "pack", pack: "mega" });
  });
  it("three or more apps: downsell drops the priciest and keeps the discount", () => {
    const o = offers({ apps: ["host", "guest", "ai", "operations"], kit: false }, 5);
    const drop = o.find((x) => x.kind === "drop") as { id: string; saving: number };
    expect(drop.id).toBe("host");
    expect(drop.saving).toBeCloseTo(34.3, 2); // 49 * 0.7
  });
  it("nothing to offer for an empty cart or the full megapack", () => {
    expect(offers({ apps: [], kit: false })).toEqual([]);
    expect(offers({ apps: [...Object.keys({}), "host", "guest", "ai", "profit", "operations", "listing", "academy", "experiences", "website"] as never, kit: false }).some((x) => x.kind === "pack")).toBe(false);
  });
});

describe("supportTotal", () => {
  it("adds the monthly support of each chosen tool once", () => {
    expect(supportTotal([])).toBe(0);
    expect(supportTotal(["host"])).toBe(SUPPORT_PRICE.host);
    expect(supportTotal(["host", "profit", "host"])).toBe(SUPPORT_PRICE.host + SUPPORT_PRICE.profit);
  });
});
