/** Single source of truth for products and plans. Mirrors the SQL enums in 0003_licensing.sql. */

export const PRODUCTS = [
  "host",
  "guest",
  "profit",
  "ai",
  "operations",
  "listing",
  "experiences",
  "website",
  "suite",
] as const;
export type ProductKey = (typeof PRODUCTS)[number];

export const PLANS = ["starter", "pro", "business"] as const;
export type PlanKey = (typeof PLANS)[number];

export type LicenseStatus = "trialing" | "active" | "past_due" | "canceled";

export interface PlanLimits {
  properties: number; // Infinity = unlimited
  users: number;
  storageMb: number;
  aiCreditsPerMonth: number;
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  starter: { properties: 2, users: 1, storageMb: 500, aiCreditsPerMonth: 50 },
  pro: { properties: 10, users: 3, storageMb: 5_000, aiCreditsPerMonth: 300 },
  business: { properties: Infinity, users: 15, storageMb: 50_000, aiCreditsPerMonth: 2_000 },
};

/** Indicative monthly prices in USD. Real prices live in the billing provider. */
export const PLAN_PRICE_USD: Record<PlanKey, number> = { starter: 19, pro: 29, business: 59 };

/** Individual apps. The suite is a bundle, not a module of its own. */
export const MODULE_PRODUCTS = PRODUCTS.filter((p) => p !== "suite") as Exclude<ProductKey, "suite">[];

export interface License {
  product: ProductKey;
  plan: PlanKey;
  status: LicenseStatus;
  currentPeriodEnd: Date | null;
}
