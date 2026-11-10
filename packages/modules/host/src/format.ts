import { toDate } from "./dates";

/** "2026-11-10" -> "10 nov" (or "10 nov 2026" with year). Parsed as UTC so the day never shifts. */
export function shortDate(iso: string, locale = "es", withYear = false): string {
  return toDate(iso).toLocaleDateString(locale, { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" }).replace(".", "");
}

/** "2026-11" -> "noviembre de 2026" (capitalized) */
export function monthTitle(year: number, month: number, locale = "es"): string {
  const t = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  return t.charAt(0).toLocaleUpperCase(locale) + t.slice(1);
}

export const STATUS_KEY = {
  confirmed: "host.statusConfirmed",
  checked_in: "host.statusCheckedIn",
  checked_out: "host.statusCheckedOut",
  canceled: "host.statusCanceled",
} as const;

export const STATUS_TONE = {
  confirmed: "bg-accent/15 text-accent",
  checked_in: "bg-success/15 text-success",
  checked_out: "bg-line text-muted",
  canceled: "bg-danger/10 text-danger",
} as const;

/** WhatsApp / tel links only for numbers with a country code. */
export function phoneDigits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("00") ? d.slice(2) : d;
}
export const isLinkablePhone = (phone: string): boolean => {
  const d = phoneDigits(phone);
  return d.length >= 8 && d.length <= 15;
};
