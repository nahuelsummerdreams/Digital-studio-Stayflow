import { CROSS_SELL, LAUNCH_KIT, MULTIPACK_MIN_APPS, MULTIPACK_PERCENT, PRODUCTS, PRODUCT_IDS, type ProductId } from "./catalog";

export interface CartState {
  /** Apps in the cart. Each one is a single licence. */
  apps: ProductId[];
  kit: boolean;
}

export interface CartLine {
  id: ProductId | "kit";
  name: string;
  price: number;
  preorder: boolean;
}

export interface Totals {
  lines: CartLine[];
  /** Number of apps (the kit is not counted: it is not eligible). */
  appCount: number;
  appsSubtotal: number;
  kitPrice: number;
  /** Everything at full price. */
  originalTotal: number;
  discountActive: boolean;
  discountPercent: number;
  discount: number;
  /** How much the customer saves: same as `discount`, named for the UI. */
  saved: number;
  total: number;
  /** Apps still missing to unlock the discount (0 when active or when the cart has no apps). */
  appsToUnlock: number;
}

const cents = (n: number): number => Math.round(n * 100) / 100;

/** Keeps the catalogue order and drops unknown ids and duplicates. */
export function normalizeApps(ids: readonly string[]): ProductId[] {
  const set = new Set(ids);
  return PRODUCT_IDS.filter((id) => set.has(id));
}

/** The whole price calculation. Pure: the cart UI, the product pages and the tests all use it. */
export function computeTotals(cart: CartState): Totals {
  const apps = normalizeApps(cart.apps);
  const lines: CartLine[] = apps.map((id) => ({ id, name: PRODUCTS[id].name, price: PRODUCTS[id].price, preorder: PRODUCTS[id].status === "preorder" }));
  if (cart.kit) lines.push({ id: "kit", name: LAUNCH_KIT.name, price: LAUNCH_KIT.price, preorder: true });

  const appsSubtotal = apps.reduce((s, id) => s + PRODUCTS[id].price, 0);
  const kitPrice = cart.kit ? LAUNCH_KIT.price : 0;
  const discountActive = apps.length >= MULTIPACK_MIN_APPS;
  const discount = discountActive ? cents((appsSubtotal * MULTIPACK_PERCENT) / 100) : 0;
  const originalTotal = appsSubtotal + kitPrice;
  return {
    lines,
    appCount: apps.length,
    appsSubtotal,
    kitPrice,
    originalTotal,
    discountActive,
    discountPercent: MULTIPACK_PERCENT,
    discount,
    saved: discount,
    total: cents(originalTotal - discount),
    appsToUnlock: apps.length > 0 && !discountActive ? MULTIPACK_MIN_APPS - apps.length : 0,
  };
}

/** Complementary apps to suggest, based on what is in the cart. Never suggests what is already there. */
export function recommendations(apps: readonly ProductId[], limit = 3): ProductId[] {
  const have = new Set(apps);
  const out: ProductId[] = [];
  for (const id of normalizeApps(apps)) {
    for (const next of CROSS_SELL[id]) {
      if (!have.has(next) && !out.includes(next)) out.push(next);
    }
  }
  return out.slice(0, limit);
}

export const usd = (n: number, locale = "en-US"): string =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
