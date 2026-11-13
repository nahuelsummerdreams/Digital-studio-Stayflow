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
/** The external checkout (Impultienda, Whop or any other) of Stayflow Host. When set, the Host buttons go straight to it; when empty they keep opening the cart (email capture). */
export const HOST_CHECKOUT_URL = (process.env.NEXT_PUBLIC_HOST_CHECKOUT_URL ?? process.env.NEXT_PUBLIC_WHOP_HOST_URL ?? "").trim();
