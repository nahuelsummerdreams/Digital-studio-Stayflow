const DAY = 86_400_000;
export const toDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
export const toIso = (d: Date): string => d.toISOString().slice(0, 10);
export const addDays = (iso: string, n: number): string => toIso(new Date(toDate(iso).getTime() + n * DAY));
/** Whole days from a to b (b - a). */
export const daysBetween = (a: string, b: string): number => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);

/** Today in the device's own calendar, not UTC. */
export function localToday(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** "2026-11-10" -> "10 nov". Parsed as UTC so the day never shifts. */
export function shortDate(iso: string, locale = "es"): string {
  return toDate(iso).toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "");
}

/** "2026-11-10" -> "mar, 10 nov" */
export function longDate(iso: string, locale = "es"): string {
  return toDate(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).replace(/\./g, "");
}
