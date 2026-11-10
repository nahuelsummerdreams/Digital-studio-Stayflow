import { DEFAULT_LOCALE } from "./money";

/** "2026-11-10" -> "10 nov 2026". Parsed as UTC so the day never shifts with the device time zone. */
export function formatDate(iso: string, locale = DEFAULT_LOCALE): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2026-11" -> "Noviembre de 2026" */
export function formatMonth(ym: string, locale = DEFAULT_LOCALE): string {
  const text = new Date(`${ym}-01T00:00:00Z`).toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** 12.5 -> "+12,5 %"; negative values keep their own minus sign. */
export function formatSignedPct(pct: number, locale = DEFAULT_LOCALE): string {
  const body = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(pct));
  return `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${body} %`;
}

export function formatPct(pct: number, locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(pct);
}
