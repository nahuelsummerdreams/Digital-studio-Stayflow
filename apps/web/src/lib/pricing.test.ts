import { describe, expect, it } from "vitest";
import { AVAILABLE_LIST, PACKS, PRODUCT_IDS, SOON_LIST, SUPPORT_PRICE, isAvailable } from "./catalog";
import { computeTotals, normalizeApps, offers, packTotals, recommendations, supportTotal } from "./pricing";

describe("what is on sale", () => {
  it("sells the four apps that exist and announces the rest", () => {
    expect(AVAILABLE_LIST.map((p) => p.id)).toEqual(["host", "guest", "profit", "operations"]);
    expect(SOON_LIST.map((p) => p.id)).toEqual(["ai", "listing", "academy", "experiences", "website"]);
    expect(isAvailable("host")).toBe(true);
    expect(isAvailable("ai")).toBe(false);
    expect(isAvailable("nope")).toBe(false);
  });
  it("never lets an app that is not on sale into a cart", () => {
    expect(normalizeApps(["ai", "host", "website"])).toEqual(["host"]);
    expect(computeTotals({ apps: ["ai", "listing"], kit: false })).toMatchObject({ appCount: 0, total: 0 });
  });
  it("only sells packs whose apps all exist", () => {
    expect(PACKS.essential.status).toBe("available");
    expect(PACKS.pro.status).toBe("available");
    expect(PACKS.mega.status).toBe("soon");
    for (const id of ["essential", "pro"] as const) for (const app of PACKS[id].apps) expect(isAvailable(app)).toBe(true);
  });
});

describe("computeTotals", () => {
  it("an empty cart is zero and unlocks nothing", () => {
    const t = computeTotals({ apps: [], kit: false });
    expect(t).toMatchObject({ total: 0, discount: 0, discountActive: false, appsToUnlock: 0 });
  });

  it("one app pays full price and asks for one more", () => {
    const t = computeTotals({ apps: ["guest"], kit: false });
    expect(t).toMatchObject({ appsSubtotal: 25, discount: 0, total: 25, appsToUnlock: 1, discountActive: false });
  });

  it("two or more apps get exactly 30% off the apps subtotal", () => {
    const t = computeTotals({ apps: ["guest", "profit"], kit: false }); // 25 + 30 = 55
    expect(t).toMatchObject({ appsSubtotal: 55, discountActive: true, discount: 16.5, saved: 16.5, total: 38.5, appsToUnlock: 0 });
  });

  it("the discount is the same 30% from 2 apps up to every app on sale", () => {
    const ids = AVAILABLE_LIST.map((p) => p.id);
    for (let n = 2; n <= ids.length; n++) {
      const t = computeTotals({ apps: normalizeApps(ids.slice(0, n)), kit: false });
      expect(t.discountPercent).toBe(30);
      expect(t.total).toBeCloseTo(t.appsSubtotal * 0.7, 2);
    }
  });

  it("the Launch Kit math stays correct (it is not on sale yet, but the rule is ready)", () => {
    const t = computeTotals({ apps: ["guest", "profit"], kit: true });
    expect(t).toMatchObject({ kitPrice: 159, originalTotal: 214, discount: 16.5, total: 197.5 });
  });

  it("ignores unknown ids and duplicates", () => {
    expect(normalizeApps(["profit", "profit", "nope", "guest"])).toEqual(["guest", "profit"]);
  });
});

describe("recommendations", () => {
  it("follows the cross-sell rules, only with apps that are on sale", () => {
    expect(recommendations(["guest"])).toEqual(["host", "operations"]);
    expect(recommendations(["profit"])).toEqual(["host", "operations"]);
    expect(recommendations(["operations"])).toEqual(["host", "profit"]);
    expect(recommendations(["host"])).toEqual(["guest", "profit", "operations"]);
  });
  it("never suggests what is already in the cart", () => {
    expect(recommendations(["guest", "host"])).toEqual(["profit", "operations"]);
  });
  it("is empty for an empty cart", () => {
    expect(recommendations([])).toEqual([]);
  });
});

describe("packs", () => {
  it("prices the ready-made packs with the 30% rule", () => {
    expect(packTotals("essential")).toMatchObject({ appsSubtotal: 104, discount: 31.2, total: 72.8 });
    expect(packTotals("pro")).toMatchObject({ appCount: 4, appsSubtotal: 133, discount: 39.9, total: 93.1 });
  });
});

describe("offers (upsell and downsell)", () => {
  it("one app: suggests the cheapest other app on sale and says how much more it costs", () => {
    const [o] = offers({ apps: ["guest"], kit: false });
    expect(o).toMatchObject({ kind: "unlock", id: "operations" });
    expect((o as { extra: number }).extra).toBeCloseTo(12.8, 2); // 25 -> 37.80 for two apps
  });
  it("two apps: suggests the smallest pack that contains them", () => {
    const o = offers({ apps: ["host", "profit"], kit: false });
    expect(o[0]).toMatchObject({ kind: "pack", pack: "essential", moreApps: 1 });
  });
  it("three apps: the next pack is the one with Operations", () => {
    expect(offers({ apps: ["host", "guest", "profit"], kit: false })[0]).toMatchObject({ kind: "pack", pack: "pro", moreApps: 1 });
  });
  it("never offers the Megapack while it is not on sale", () => {
    const all = AVAILABLE_LIST.map((p) => p.id);
    expect(offers({ apps: all, kit: false }).some((x) => x.kind === "pack")).toBe(false);
    expect(offers({ apps: ["host", "operations"], kit: false }).some((x) => x.kind === "pack" && x.pack === "mega")).toBe(false);
  });
  it("three or more apps: downsell drops the priciest and keeps the discount", () => {
    const o = offers({ apps: ["host", "guest", "profit", "operations"], kit: false }, 5);
    const drop = o.find((x) => x.kind === "drop") as { id: string; saving: number };
    expect(drop.id).toBe("host");
    expect(drop.saving).toBeCloseTo(34.3, 2); // 49 * 0.7
  });
  it("nothing to offer for an empty cart", () => {
    expect(offers({ apps: [], kit: false })).toEqual([]);
  });
});

describe("supportTotal", () => {
  it("adds the monthly support of each chosen tool once", () => {
    expect(supportTotal([])).toBe(0);
    expect(supportTotal(["host"])).toBe(SUPPORT_PRICE.host);
    expect(supportTotal(["host", "profit", "host"])).toBe(SUPPORT_PRICE.host + SUPPORT_PRICE.profit);
  });
  it("has a price for every product", () => {
    for (const id of PRODUCT_IDS) expect(SUPPORT_PRICE[id]).toBeGreaterThan(0);
  });
});
