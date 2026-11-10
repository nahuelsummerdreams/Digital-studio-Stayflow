const DAY = 86_400_000;

export const toDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
export const toIso = (d: Date): string => d.toISOString().slice(0, 10);
export const addDays = (iso: string, n: number): string => toIso(new Date(toDate(iso).getTime() + n * DAY));
/** Whole days from a to b (b - a). */
export const daysBetween = (a: string, b: string): number => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);
export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();
export const firstOfMonth = (year: number, month: number): string => toIso(new Date(Date.UTC(year, month - 1, 1)));
/** First day of the following month. */
export const firstOfNextMonth = (year: number, month: number): string => toIso(new Date(Date.UTC(year, month, 1)));

/** Today in the device's own calendar, not UTC (which flips a day early or late near midnight). */
export function localToday(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}
