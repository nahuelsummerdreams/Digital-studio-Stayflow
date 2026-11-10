/**
 * The commercial catalogue. One place for ids, prices and rules; the words live in src/i18n.
 * Prices are whole US dollars. Change a number here and the whole site follows.
 */
export const PRODUCT_IDS = ["host", "guest", "ai", "profit", "operations", "listing", "academy", "experiences", "website"] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

/** "available": works today, instant access. "preorder": being built, delivery date not announced yet. */
export type ProductStatus = "available" | "preorder";

export interface Product {
  id: ProductId;
  name: string;
  price: number;
  status: ProductStatus;
  /** Shown only for live apps. */
  appUrl?: string;
}

const PROFIT_URL = process.env.NEXT_PUBLIC_PROFIT_URL ?? "https://stayflow-profit.vercel.app";
const HOST_URL = process.env.NEXT_PUBLIC_HOST_URL ?? "https://stayflow-host.vercel.app";
const GUEST_URL = process.env.NEXT_PUBLIC_GUEST_URL ?? "https://stayflow-guest-eight.vercel.app";

export const PRODUCTS: Record<ProductId, Product> = {
  host: { id: "host", name: "Stayflow Host", price: 49, status: "available", appUrl: HOST_URL },
  guest: { id: "guest", name: "Stayflow Guest", price: 49, status: "available", appUrl: GUEST_URL },
  ai: { id: "ai", name: "Stayflow AI", price: 29, status: "preorder" },
  profit: { id: "profit", name: "Stayflow Profit", price: 19, status: "available", appUrl: PROFIT_URL },
  operations: { id: "operations", name: "Stayflow Operations", price: 29, status: "preorder" },
  listing: { id: "listing", name: "Stayflow Listing", price: 19, status: "preorder" },
  academy: { id: "academy", name: "Stayflow Academy", price: 19, status: "preorder" },
  experiences: { id: "experiences", name: "Stayflow Experiences", price: 29, status: "preorder" },
  website: { id: "website", name: "Stayflow Website", price: 39, status: "preorder" },
};

export const PRODUCT_LIST: Product[] = PRODUCT_IDS.map((id) => PRODUCTS[id]);

/** The complementary premium product. Not an app, so the Multi-Pack discount does not apply to it. */
export const LAUNCH_KIT = { id: "kit", name: "Host Launch Kit", price: 159 } as const;

/** Multi-Pack: this much off the apps' subtotal when two or more apps are combined. */
export const MULTIPACK_PERCENT = 30;
export const MULTIPACK_MIN_APPS = 2;

/** "If they add X, suggest Y". Order = priority. */
export const CROSS_SELL: Record<ProductId, ProductId[]> = {
  guest: ["ai", "experiences"],
  profit: ["operations"],
  listing: ["website"],
  operations: ["profit", "ai"],
  website: ["experiences"],
  host: ["profit", "guest"],
  ai: ["guest"],
  academy: ["listing"],
  experiences: ["guest"],
};

export const PLAN_IDS = ["starter", "pro", "business"] as const;
export type PlanId = (typeof PLAN_IDS)[number];
export const PLAN_PRICE: Record<PlanId, number> = { starter: 19, pro: 29, business: 59 };

/** Ready-made packs: the apps are the ones in the cart, so the 30% Multi-Pack rule prices them. */
export const PACK_IDS = ["essential", "pro", "mega"] as const;
export type PackId = (typeof PACK_IDS)[number];
export const PACKS: Record<PackId, { id: PackId; apps: ProductId[] }> = {
  essential: { id: "essential", apps: ["host", "guest", "profit"] },
  pro: { id: "pro", apps: ["host", "guest", "profit", "operations", "ai"] },
  mega: { id: "mega", apps: [...PRODUCT_IDS] },
};
