/**
 * How fresh are the linked calendars (Airbnb, Booking, VRBO...), and is anything wrong with them?
 * Pure, so it is tested. Host reads those calendars by iCal, which is not instant, and the platforms read Host's calendar at their own pace:
 * so the host is told, plainly, how old the data is and when something needs a look.
 */
export const FRESH_MINUTES = 30;
export const OLD_MINUTES = 120;

export interface SyncInput {
  icalUrl: string | null;
  syncedAt: string | null;
  status: string | null;
}

export type SyncLevel = "none" | "fresh" | "stale" | "old";

export interface SyncHealth {
  level: SyncLevel;
  /** Properties with a linked calendar. */
  linked: number;
  /** Age in minutes of the least recently read calendar; null when some calendar was never read. */
  oldestMinutes: number | null;
  /** Calendars that could not be read the last time. */
  errors: number;
  /** Reservations from a platform that overlap the host's own and were not imported. */
  conflicts: number;
  /** True when the host should see a notice. */
  needsAttention: boolean;
}

/** The status text the sync route writes: "ok", "N se cruzan con reservas tuyas" or "No se pudo leer el calendario (...)". */
export function syncHealth(props: readonly SyncInput[], now: number): SyncHealth {
  const linked = props.filter((p) => p.icalUrl);
  if (linked.length === 0) return { level: "none", linked: 0, oldestMinutes: null, errors: 0, conflicts: 0, needsAttention: false };

  let neverRead = false;
  let oldest = 0;
  let errors = 0;
  let conflicts = 0;
  for (const p of linked) {
    if (!p.syncedAt) neverRead = true;
    else oldest = Math.max(oldest, Math.max(0, now - new Date(p.syncedAt).getTime()));
    const s = p.status ?? "";
    if (s.startsWith("No se pudo")) errors += 1;
    const m = /^(\d+) se cruzan/.exec(s);
    if (m) conflicts += Number(m[1]);
  }
  const oldestMinutes = neverRead ? null : Math.floor(oldest / 60_000);
  const level: SyncLevel = oldestMinutes === null || oldestMinutes > OLD_MINUTES ? "old" : oldestMinutes > FRESH_MINUTES ? "stale" : "fresh";
  return { level, linked: linked.length, oldestMinutes, errors, conflicts, needsAttention: level !== "fresh" || errors > 0 || conflicts > 0 };
}

/** "5 min" or "3 h": compact, for the notice. */
export function agoLabel(minutes: number): { unit: "min" | "h"; n: number } {
  return minutes < 90 ? { unit: "min", n: Math.max(1, minutes) } : { unit: "h", n: Math.round(minutes / 60) };
}
