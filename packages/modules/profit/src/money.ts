import type { Minor } from "./types";

export function formatMoney(amount: Minor, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

/** Parses user input like "1,250.50" or "1250" into minor units. Returns null if invalid. */
export function parseMoney(input: string): Minor | null {
  const cleaned = input.replace(/[^0-9.,-]/g, "").replace(/,(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && cleaned !== "" ? Math.round(n * 100) : null;
}
