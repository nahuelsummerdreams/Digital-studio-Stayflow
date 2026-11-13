import { SUPPORT_PRICE, CROSS_SELL, LAUNCH_KIT, MULTIPACK_MIN_APPS, MULTIPACK_PERCENT, PACKS, PACK_IDS, PRODUCTS, PRODUCT_IDS, PACK_PRICE, PROMO_PACK_PRICE, isAvailable, type PackId, type ProductId } from "./catalog";

export interface CartState {
  /** Apps in the cart. Each one is a single licence. */
  apps: ProductId[];
  kit: boolean;
}

export interface CartLine {
  id: ProductId | "kit";
  name: string;
  price: number;
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
  /** What it would cost without the launch promotion (the normal 30% rule). Same as `total` when no promotion applies. */
  regularTotal: number;
  /** The pack whose promotional price applies to this exact cart, if any. */
  promoPack: PackId | null;
  /** Apps still missing to unlock the discount (0 when active or when the cart has no apps). */
  appsToUnlock: number;
}

const cents = (n: number): number => Math.round(n * 100) / 100;

/** Keeps the catalogue order and drops unknown ids, duplicates and anything that is not on sale yet. */
export function normalizeApps(ids: readonly string[]): ProductId[] {
  const set = new Set(ids);
  return PRODUCT_IDS.filter((id) => set.has(id) && isAvailable(id));
}

/** The whole price calculation. Pure: the cart UI, the product pages and the tests all use it. */
export function computeTotals(cart: CartState, promo = false): Totals {
  const apps = normalizeApps(cart.apps);
  const lines: CartLine[] = apps.map((id) => ({ id, name: PRODUCTS[id].name, price: PRODUCTS[id].price }));
  if (cart.kit) lines.push({ id: "kit", name: LAUNCH_KIT.name, price: LAUNCH_KIT.price });

  const appsSubtotal = apps.reduce((s, id) => s + PRODUCTS[id].price, 0);
  const kitPrice = cart.kit ? LAUNCH_KIT.price : 0;
  const discountActive = apps.length >= MULTIPACK_MIN_APPS;
  const discount = discountActive ? cents((appsSubtotal * MULTIPACK_PERCENT) / 100) : 0;
  const originalTotal = appsSubtotal + kitPrice;
  const regularTotal = cents(originalTotal - discount);
  // A ready-made pack (exactly its apps, nothing else) has its own price when that is better than the 30% rule.
  const pack = !cart.kit ? PACK_IDS.find((id) => PACKS[id].status === "available" && PACKS[id].apps.length === apps.length && PACKS[id].apps.every((a) => apps.includes(a))) ?? null : null;
  const fixed = pack && PACK_PRICE[pack] < regularTotal ? PACK_PRICE[pack] : null;
  // A launch promotion prices a ready-made pack. It only applies when the cart is exactly that pack (no kit, nothing else).
  const promoPack = promo && !cart.kit ? PACK_IDS.find((id) => PACKS[id].status === "available" && PACKS[id].apps.length === apps.length && PACKS[id].apps.every((a) => apps.includes(a))) ?? null : null;
  const standing = fixed ?? regularTotal;
  if (promoPack && PROMO_PACK_PRICE[promoPack] < standing) {
    const price = PROMO_PACK_PRICE[promoPack];
    const promoDiscount = cents(originalTotal - price);
    return {
      lines, appCount: apps.length, appsSubtotal, kitPrice, originalTotal, discountActive: true,
      discountPercent: Math.round((promoDiscount / appsSubtotal) * 1000) / 10, discount: promoDiscount, saved: promoDiscount, total: price, regularTotal: standing, promoPack, appsToUnlock: 0,
    };
  }
  if (fixed !== null) {
    const packDiscount = cents(originalTotal - fixed);
    return {
      lines, appCount: apps.length, appsSubtotal, kitPrice, originalTotal, discountActive: true,
      discountPercent: Math.round((packDiscount / appsSubtotal) * 1000) / 10, discount: packDiscount, saved: packDiscount, total: fixed, regularTotal: fixed, promoPack: null, appsToUnlock: 0,
    };
  }
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
    total: regularTotal,
    regularTotal,
    promoPack: null,
    appsToUnlock: apps.length > 0 && !discountActive ? MULTIPACK_MIN_APPS - apps.length : 0,
  };
}

/** Complementary apps to suggest, based on what is in the cart. Never suggests what is already there. */
export function recommendations(apps: readonly ProductId[], limit = 3): ProductId[] {
  const have = new Set(apps);
  const out: ProductId[] = [];
  for (const id of normalizeApps(apps)) {
    for (const next of CROSS_SELL[id]) {
      if (isAvailable(next) && !have.has(next) && !out.includes(next)) out.push(next);
    }
  }
  return out.slice(0, limit);
}

/** "USD 49" or "USD 47,60": whole dollars stay clean, cents use the Spanish comma. */
export const usd = (n: number): string => `USD ${Number.isInteger(n) ? n : n.toFixed(2).replace(".", ",")}`;

/** What a ready-made pack costs, with the Multi-Pack rule applied. */
export const packTotals = (id: PackId, promo = false): Totals => computeTotals({ apps: PACKS[id].apps, kit: false }, promo);

export type Offer =
  /** Upsell: one app in the cart, add the cheapest other one to unlock the discount. `extra` can be negative: it ends up cheaper. */
  | { kind: "unlock"; id: ProductId; extra: number }
  /** Upsell: the smallest ready-made pack that contains everything in the cart and adds more. */
  | { kind: "pack"; pack: PackId; moreApps: number; extra: number }
  /** Downsell: drop the priciest app and keep the discount, for people who find the cart heavy. */
  | { kind: "drop"; id: ProductId; saving: number };

/** Upsell and downsell suggestions for a cart, best first. Pure, so it is tested. */
export function offers(cart: CartState, limit = 2): Offer[] {
  const apps = normalizeApps(cart.apps);
  const now = computeTotals({ apps, kit: false }).total;
  const out: Offer[] = [];

  if (apps.length === 1) {
    const cheapest = PRODUCT_IDS.filter((id) => isAvailable(id) && !apps.includes(id)).sort((a, b) => PRODUCTS[a].price - PRODUCTS[b].price)[0];
    if (cheapest) out.push({ kind: "unlock", id: cheapest, extra: cents(computeTotals({ apps: [...apps, cheapest], kit: false }).total - now) });
  }

  if (apps.length >= MULTIPACK_MIN_APPS) {
    const next = PACK_IDS.map((id) => PACKS[id])
      .filter((p) => p.status === "available" && p.apps.length > apps.length && apps.every((a) => p.apps.includes(a)))
      .sort((a, b) => a.apps.length - b.apps.length)[0];
    if (next) out.push({ kind: "pack", pack: next.id, moreApps: next.apps.length - apps.length, extra: cents(packTotals(next.id).total - now) });
  }

  if (apps.length >= 3) {
    const priciest = [...apps].sort((a, b) => PRODUCTS[b].price - PRODUCTS[a].price)[0]!;
    if (PRODUCTS[priciest].price >= 39) {
      const without = computeTotals({ apps: apps.filter((a) => a !== priciest), kit: false }).total;
      out.push({ kind: "drop", id: priciest, saving: cents(now - without) });
    }
  }
  return out.slice(0, limit);
}

/** Monthly cost of the support the customer picked, tool by tool. Unknown or repeated ids count once. */
export function supportTotal(ids: ProductId[]): number {
  return [...new Set(ids)].reduce((sum, id) => sum + (SUPPORT_PRICE[id] ?? 0), 0);
}
