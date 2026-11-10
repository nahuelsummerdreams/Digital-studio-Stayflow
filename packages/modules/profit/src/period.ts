/** Period filters for the overview. Dates are plain YYYY-MM-DD strings (no time zones involved). */
export const PERIODS = ["this_month", "last_month", "this_year", "all"] as const;
export type Period = (typeof PERIODS)[number];

export interface DateRange {
  from: string;
  to: string;
}
export interface PeriodRange {
  /** null = no limit */
  current: DateRange | null;
  /** Comparable earlier range, or null when there is nothing fair to compare with. */
  previous: DateRange | null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Today in the device's own calendar (not UTC, which flips a day early or late near midnight). */
export function localToday(now: Date = new Date()): string {
  return iso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * "This month" and "this year" run up to today and compare with the same number of days
 * in the previous month/year, so a half-finished month is never compared with a full one.
 */
export function periodRange(period: Period, today: string): PeriodRange {
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const prevM = m === 1 ? 12 : m - 1;
  const prevMY = m === 1 ? y - 1 : y;

  switch (period) {
    case "this_month":
      return {
        current: { from: iso(y, m, 1), to: today },
        previous: { from: iso(prevMY, prevM, 1), to: iso(prevMY, prevM, Math.min(d, daysInMonth(prevMY, prevM))) },
      };
    case "last_month": {
      const beforeM = prevM === 1 ? 12 : prevM - 1;
      const beforeY = prevM === 1 ? prevMY - 1 : prevMY;
      return {
        current: { from: iso(prevMY, prevM, 1), to: iso(prevMY, prevM, daysInMonth(prevMY, prevM)) },
        previous: { from: iso(beforeY, beforeM, 1), to: iso(beforeY, beforeM, daysInMonth(beforeY, beforeM)) },
      };
    }
    case "this_year":
      return {
        current: { from: iso(y, 1, 1), to: today },
        previous: { from: iso(y - 1, 1, 1), to: iso(y - 1, m, Math.min(d, daysInMonth(y - 1, m))) },
      };
    case "all":
      return { current: null, previous: null };
  }
}

export function inRange(date: string, range: DateRange | null): boolean {
  return range === null || (date >= range.from && date <= range.to);
}

/** Percent change vs the previous value, one decimal. null when there is no base to compare. */
export function changePct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}
