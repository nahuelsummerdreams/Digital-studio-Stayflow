import { translate, type MessageKey, type Vars } from "@stayflow/i18n/core";

/** Server-side translator for the landing (Spanish for now, English later). */
export const t = (key: MessageKey, vars?: Vars): string => translate("es", key, vars);

/** Where each app lives. Defaults are the published addresses; override with env for local work. */
export const PROFIT_URL = process.env.NEXT_PUBLIC_PROFIT_URL ?? "https://stayflow-profit.vercel.app";
export const HOST_URL = process.env.NEXT_PUBLIC_HOST_URL ?? "https://stayflow-host.vercel.app";
export const GUEST_URL = process.env.NEXT_PUBLIC_GUEST_URL ?? "https://stayflow-guest-eight.vercel.app";
/** Where "start free trial" sends people. */
export const APP_URL = PROFIT_URL;
/** Where "Comprar el pack" goes once the store is connected. Empty = the button reads "Más información". */
export const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "";

/**
 * The Megapack arithmetic, in one place. Per-app list prices are the "valor por separado"; the pack is that sum minus
 * DISCOUNT_PCT. Change a number here and the whole landing follows. (99 + 69 + 45 = 213; -30 % = 149.)
 */
export const APP_PRICES = { host: 99, profit: 69, guest: 45 } as const;
export const DISCOUNT_PCT = 30;
export const SEPARATE_TOTAL = APP_PRICES.host + APP_PRICES.profit + APP_PRICES.guest;
export const PACK_PRICE = Math.round(SEPARATE_TOTAL * (1 - DISCOUNT_PCT / 100));
export const PACK_SAVING = SEPARATE_TOTAL - PACK_PRICE;
