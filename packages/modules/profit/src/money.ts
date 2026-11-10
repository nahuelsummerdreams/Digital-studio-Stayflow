import type { Minor } from "./types";

export const DEFAULT_LOCALE = "es";

/** Spanish skips the thousands separator on 4-digit numbers ("1251"); we always want "1.251". */
function groupAlways(options: Intl.NumberFormatOptions): Intl.NumberFormatOptions {
  return { ...options, useGrouping: "always" } as unknown as Intl.NumberFormatOptions;
}

/** Whole units, for summaries. Always groups thousands ("1.251 €"). */
export function formatMoney(amount: Minor, currency = "USD", locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, groupAlways({ style: "currency", currency, maximumFractionDigits: 0 })).format(amount / 100);
}

/** Full precision, for individual entries (summaries round to whole units). */
export function formatMoneyExact(amount: Minor, currency = "USD", locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, groupAlways({ style: "currency", currency })).format(amount / 100);
}

/**
 * Parses what a person types into minor units. Accepts both conventions:
 * "1.250,50" (es) and "1,250.50" (en). The last separator is the decimal mark only when
 * 1-2 digits follow it; three digits mean thousands ("1.250" = 1250). Returns null if invalid.
 */
export function parseMoney(input: string): Minor | null {
  const s = input.trim().replace(/[^\d.,-]/g, "");
  if (!/\d/.test(s)) return null;
  const negative = s.startsWith("-");
  const body = s.replace(/-/g, "");
  const last = Math.max(body.lastIndexOf("."), body.lastIndexOf(","));
  let whole = body;
  let cents = "";
  if (last !== -1) {
    const tail = body.slice(last + 1);
    if (tail.length === 1 || tail.length === 2) {
      whole = body.slice(0, last);
      cents = tail;
    } else if (tail.length !== 3 && tail.length !== 0) {
      return null;
    }
  }
  const digits = whole.replace(/[.,]/g, "");
  if (digits === "" && cents === "") return null;
  const value = Number(digits || "0") * 100 + Number(cents.padEnd(2, "0") || "0");
  if (!Number.isSafeInteger(value)) return null;
  return negative ? -value : value;
}
