import { MODULE_PRODUCTS, PLAN_LIMITS, type License, type PlanLimits, type ProductKey } from "./catalog";

const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"]);

export function isLicenseValid(license: License, now: Date = new Date()): boolean {
  if (!ACTIVE_STATUSES.has(license.status)) return false;
  return license.currentPeriodEnd === null || license.currentPeriodEnd > now;
}

/** A valid `suite` license unlocks every module. Mirrors public.has_product_access in SQL. */
export function hasProductAccess(licenses: License[], product: ProductKey, now: Date = new Date()): boolean {
  return licenses.some(
    (l) => isLicenseValid(l, now) && (l.product === product || l.product === "suite"),
  );
}

export function unlockedProducts(licenses: License[], now: Date = new Date()): ProductKey[] {
  return MODULE_PRODUCTS.filter((p) => hasProductAccess(licenses, p, now));
}

/** Limits of the best valid license covering the product (the most generous wins). */
export function limitsFor(licenses: License[], product: ProductKey, now: Date = new Date()): PlanLimits | null {
  const covering = licenses.filter(
    (l) => isLicenseValid(l, now) && (l.product === product || l.product === "suite"),
  );
  if (covering.length === 0) return null;
  return covering
    .map((l) => PLAN_LIMITS[l.plan])
    .reduce((best, cur) => ({
      properties: Math.max(best.properties, cur.properties),
      users: Math.max(best.users, cur.users),
      storageMb: Math.max(best.storageMb, cur.storageMb),
      aiCreditsPerMonth: Math.max(best.aiCreditsPerMonth, cur.aiCreditsPerMonth),
    }));
}
