/**
 * The commercial catalogue. One place for ids, prices and rules; the words live in src/i18n.
 * Prices are whole US dollars. Change a number here and the whole site follows.
 */
export const PRODUCT_IDS = ["host", "guest", "ai", "profit", "operations", "listing", "academy", "experiences", "website"] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

/** "available": works today, instant access, sold. "soon": not built yet: shown as "Próximamente", never sold, only a "tell me when it is out" email. */
export type ProductStatus = "available" | "soon";

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
const OPERATIONS_URL = process.env.NEXT_PUBLIC_OPERATIONS_URL ?? "https://stayflow-operations.vercel.app";
const GUEST_URL = process.env.NEXT_PUBLIC_GUEST_URL ?? "https://stayflow-guest-eight.vercel.app";

export const PRODUCTS: Record<ProductId, Product> = {
  host: { id: "host", name: "Stayflow Host", price: 49, status: "available", appUrl: HOST_URL },
  guest: { id: "guest", name: "Stayflow Guest", price: 25, status: "available", appUrl: GUEST_URL },
  ai: { id: "ai", name: "Stayflow AI", price: 29, status: "soon" },
  profit: { id: "profit", name: "Stayflow Business", price: 30, status: "available", appUrl: PROFIT_URL },
  operations: { id: "operations", name: "Stayflow Operations", price: 29, status: "available", appUrl: OPERATIONS_URL },
  listing: { id: "listing", name: "Stayflow Listing", price: 19, status: "soon" },
  academy: { id: "academy", name: "Stayflow Academy", price: 19, status: "soon" },
  experiences: { id: "experiences", name: "Stayflow Experiences", price: 29, status: "soon" },
  website: { id: "website", name: "Stayflow Website", price: 39, status: "soon" },
};

export const PRODUCT_LIST: Product[] = PRODUCT_IDS.map((id) => PRODUCTS[id]);
export const isAvailable = (id: string): id is ProductId => id in PRODUCTS && PRODUCTS[id as ProductId].status === "available";
/** What is sold today, and what is only announced. */
export const AVAILABLE_LIST: Product[] = PRODUCT_LIST.filter((p) => p.status === "available");
export const SOON_LIST: Product[] = PRODUCT_LIST.filter((p) => p.status === "soon");

/** The complementary premium product. Not built yet ("Próximamente"), so the site does not sell it. Not an app: the Multi-Pack discount never applies to it. */
export const LAUNCH_KIT = { id: "kit", name: "Host Launch Kit", price: 159, status: "soon" } as const;

/** Updates: every purchase includes this many months of improvements. After that the app keeps working exactly the same; renewing is optional, whenever the customer wants. Copy lives in i18n; change the numbers here AND there. */
export const UPDATES_MONTHS = 12;
export const UPDATES_RENEWAL_USD = 10;

/** Multi-Pack: this much off the apps' subtotal when two or more apps are combined. */
export const MULTIPACK_PERCENT = 30;
export const MULTIPACK_MIN_APPS = 2;

/** "If they add X, suggest Y". Order = priority. */
export const CROSS_SELL: Record<ProductId, ProductId[]> = {
  host: ["guest", "profit", "operations"],
  guest: ["host", "operations"],
  profit: ["host", "operations"],
  operations: ["host", "profit"],
  // Not on sale yet: kept so the rules are ready when they are.
  ai: ["guest"],
  listing: ["website"],
  academy: ["listing"],
  experiences: ["guest"],
  website: ["experiences"],
};

/** Optional monthly support, chosen per tool (USD/month). Provisional prices: confirm before opening sales. */
export const SUPPORT_PRICE: Record<ProductId, number> = { host: 9, guest: 9, ai: 7, profit: 5, operations: 7, listing: 5, academy: 5, experiences: 7, website: 9 };

/** Ready-made packs. A pack is sold only when every app in it exists. The Megapack is every app that is on sale today. */
export const PACK_IDS = ["essential", "mega"] as const;
export type PackId = (typeof PACK_IDS)[number];
export const PACKS: Record<PackId, { id: PackId; apps: ProductId[]; status: ProductStatus }> = {
  essential: { id: "essential", apps: ["host", "guest", "profit"], status: "available" },
  mega: { id: "mega", apps: PRODUCT_IDS.filter((id) => PRODUCTS[id].status === "available"), status: "available" },
};
