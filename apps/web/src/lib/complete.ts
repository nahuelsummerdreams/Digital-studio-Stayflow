/**
 * STAYflow COMPLETE: the one product the new landing sells. The price, the launch price and the day it ends live here.
 * Prices are whole US dollars, one payment (no subscription).
 */
export const COMPLETE_PRICE = 89;
/** Launch price: valid until the launch ends (30 November 2026, Argentina time) and then the regular price applies. */
export const COMPLETE_LAUNCH_PRICE = 40;

/** Last minute of the launch. Argentina has no daylight saving, so the offset is fixed. */
export const DEFAULT_COMPLETE_LAUNCH_ENDS_AT = "2026-11-30T23:59:00-03:00";

/** The payment link (Whop, Impultienda…) once the store exists. While it is empty the page only collects the email. */
export const COMPLETE_CHECKOUT_URL = (process.env.NEXT_PUBLIC_COMPLETE_CHECKOUT_URL ?? "").trim();

/**
 * When the launch price ends, as a timestamp. `NEXT_PUBLIC_COMPLETE_LAUNCH_ENDS_AT` overrides the date ("off" turns the launch price off).
 * An unreadable value means NO launch price: it is safer to show the regular price than a price that never ends.
 */
export function completeLaunchEndsAt(raw: string | undefined = process.env.NEXT_PUBLIC_COMPLETE_LAUNCH_ENDS_AT): number | null {
  const value = (raw ?? DEFAULT_COMPLETE_LAUNCH_ENDS_AT).trim();
  if (!value || value.toLowerCase() === "off") return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

export const completeLaunchIsOn = (now: number, endsAt: number | null = completeLaunchEndsAt()): boolean => endsAt !== null && now < endsAt;

export interface CompleteOffer {
  launch: boolean;
  /** What is charged right now. */
  price: number;
  /** The regular price. */
  regular: number;
  /** How much the launch price saves (0 when there is no launch). */
  saved: number;
  /** The saving as a whole percentage of the regular price (0 when there is no launch). */
  savedPct: number;
}

export function completeOffer(now: number, endsAt: number | null = completeLaunchEndsAt()): CompleteOffer {
  const launch = completeLaunchIsOn(now, endsAt) && COMPLETE_LAUNCH_PRICE < COMPLETE_PRICE;
  const price = launch ? COMPLETE_LAUNCH_PRICE : COMPLETE_PRICE;
  const saved = COMPLETE_PRICE - price;
  return { launch, price, regular: COMPLETE_PRICE, saved, savedPct: Math.round((saved / COMPLETE_PRICE) * 100) };
}

/** Whole days left until the launch ends, counting a started day as a day (never negative). */
export function launchDaysLeft(now: number, endsAt: number | null = completeLaunchEndsAt()): number {
  if (endsAt === null) return 0;
  return Math.max(0, Math.ceil((endsAt - now) / 86_400_000));
}
