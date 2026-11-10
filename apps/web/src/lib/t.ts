import { translate, type MessageKey, type Vars } from "@stayflow/i18n/core";

/** Server-side translator for the landing (Spanish for now, English later). */
export const t = (key: MessageKey, vars?: Vars): string => translate("es", key, vars);

/** Where "start free trial" sends people: the Stayflow Profit app. */
export const APP_URL = process.env.NEXT_PUBLIC_PROFIT_URL ?? "http://localhost:3001";
