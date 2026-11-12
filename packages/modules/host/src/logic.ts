import { addDays, daysBetween, firstOfMonth, firstOfNextMonth, toDate } from "./dates";
import type { Booking, BookingStatus, HostTask, NewBooking } from "./types";

/** A canceled booking or a plain inquiry holds no dates and counts for nothing. */
export const isActive = (b: Pick<Booking, "status">): boolean => b.status !== "canceled" && b.status !== "inquiry";

/** Nights of `b` that fall in [from, to). */
export function nightsWithin(b: Pick<Booking, "checkIn" | "checkOut">, from: string, to: string): number {
  const start = b.checkIn > from ? b.checkIn : from;
  const end = b.checkOut < to ? b.checkOut : to;
  return Math.max(0, daysBetween(start, end));
}

/** Percentage of available nights that are booked in [from, to), across the given properties. */
export function occupancyPct(bookings: Booking[], propertyIds: string[], from: string, to: string): number {
  const days = daysBetween(from, to);
  if (propertyIds.length === 0 || days <= 0) return 0;
  const ids = new Set(propertyIds);
  const booked = bookings.filter((b) => isActive(b) && ids.has(b.propertyId)).reduce((s, b) => s + nightsWithin(b, from, to), 0);
  return Math.round((booked / (days * propertyIds.length)) * 1000) / 10;
}

/** Who arrives and who leaves on a given day. */
export function movementsOn(bookings: Booking[], day: string): { arrivals: Booking[]; departures: Booking[] } {
  const live = bookings.filter(isActive);
  return {
    arrivals: live.filter((b) => b.checkIn === day),
    departures: live.filter((b) => b.checkOut === day),
  };
}

/** Confirmed stays arriving from `today` through `today + days`, soonest first. */
export function upcomingArrivals(bookings: Booking[], today: string, days: number): Booking[] {
  const last = addDays(today, days);
  return bookings
    .filter((b) => b.status === "confirmed" && b.checkIn >= today && b.checkIn <= last)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.guestName.localeCompare(b.guestName));
}

/** Booking income by check-in date within [from, to). */
export function bookedRevenue(bookings: Booking[], from: string, to: string): number {
  return bookings.filter((b) => isActive(b) && b.checkIn >= from && b.checkIn < to).reduce((s, b) => s + b.amount, 0);
}

export interface CalendarSegment {
  bookingId: string;
  guestName: string;
  status: BookingStatus;
  /** 1-based day of the month where the bar starts. */
  startDay: number;
  span: number;
  startsBefore: boolean;
  endsAfter: boolean;
}

/** The bars to draw for one property in one month. Nights run from check-in to the day before check-out. */
export function monthSegments(bookings: Booking[], propertyId: string, year: number, month: number): CalendarSegment[] {
  const from = firstOfMonth(year, month);
  const to = firstOfNextMonth(year, month);
  return bookings
    .filter((b) => isActive(b) && b.propertyId === propertyId)
    .flatMap((b) => {
      const start = b.checkIn > from ? b.checkIn : from;
      const end = b.checkOut < to ? b.checkOut : to;
      const span = daysBetween(start, end);
      if (span <= 0) return [];
      return [
        {
          bookingId: b.id,
          guestName: b.guestName,
          status: b.status,
          startDay: toDate(start).getUTCDate(),
          span,
          startsBefore: b.checkIn < from,
          endsAfter: b.checkOut > to,
        },
      ];
    })
    .sort((a, b) => a.startDay - b.startDay);
}

export interface GuestRecord {
  key: string;
  name: string;
  email: string;
  phone: string;
  stays: number;
  nights: number;
  spent: number;
  lastStay: string;
}

/** The identity of the person behind a booking: their email, or their name when there is none. */
export const guestKeyOf = (b: Pick<Booking, "guestEmail" | "guestName">): string => (b.guestEmail.trim() || b.guestName.trim()).toLowerCase();

/** Guests are not typed in twice: they are the people behind the bookings. Same email (or name) = same guest. */
export function guestsDirectory(bookings: Booking[]): GuestRecord[] {
  const map = new Map<string, GuestRecord & { latest: string }>();
  for (const b of [...bookings].sort((x, y) => x.checkIn.localeCompare(y.checkIn))) {
    if (!isActive(b)) continue;
    const key = guestKeyOf(b);
    const prev = map.get(key);
    map.set(key, {
      key,
      name: b.guestName.trim() || prev?.name || "",
      email: b.guestEmail.trim() || prev?.email || "",
      phone: b.guestPhone.trim() || prev?.phone || "",
      stays: (prev?.stays ?? 0) + 1,
      nights: (prev?.nights ?? 0) + b.nights,
      spent: (prev?.spent ?? 0) + b.amount,
      lastStay: b.checkOut > (prev?.lastStay ?? "") ? b.checkOut : (prev?.lastStay ?? ""),
      latest: b.checkIn,
    });
  }
  return [...map.values()].map(({ latest: _latest, ...g }) => g).sort((a, b) => b.lastStay.localeCompare(a.lastStay));
}

/** What a booking can become next. Keeps the daily flow to one tap. */
export function nextStatuses(status: BookingStatus): BookingStatus[] {
  switch (status) {
    case "inquiry":
      return ["pending", "confirmed", "canceled"];
    case "pending":
      return ["confirmed", "canceled"];
    case "confirmed":
      return ["checked_in", "canceled"];
    case "checked_in":
      return ["checked_out"];
    default:
      return [];
  }
}

export type BookingError = "host.errName" | "host.errDates" | "host.errLong" | "host.errAmount" | "host.errOverlap";

/** Friendly checks before hitting the database (which enforces the same rules for real). */
export function validateBooking(input: NewBooking, existing: Booking[]): BookingError | null {
  if (input.guestName.trim() === "") return "host.errName";
  if (!input.checkIn || !input.checkOut || input.checkOut <= input.checkIn) return "host.errDates";
  if (daysBetween(input.checkIn, input.checkOut) > 366) return "host.errLong";
  if (!Number.isFinite(input.amount) || input.amount < 0) return "host.errAmount";
  if (input.status === "inquiry") return null;
  const clash = existing.some(
    (b) => isActive(b) && b.propertyId === input.propertyId && b.checkIn < input.checkOut && input.checkIn < b.checkOut,
  );
  return clash ? "host.errOverlap" : null;
}

// ---------------------------------------------------------------------------------------------------
// Half-day calendar. Every day has two halves: a guest checks in during the SECOND half (after noon) and
// checks out during the FIRST half (before noon). So a stay Oct 9 -> Oct 15 fills the second half of the 9th
// through the first half of the 15th, and the second half of the 15th is free for the next guest.
// ---------------------------------------------------------------------------------------------------

export interface HalfSegment {
  bookingId: string;
  label: string;
  status: BookingStatus;
  kind: "stay" | "block";
  /** 0-based half-slot where the bar starts: day d, first half = 2(d-1), second half = 2(d-1)+1. */
  startHalf: number;
  /** How many half-slots the bar covers. */
  spanHalves: number;
  startsBefore: boolean;
  endsAfter: boolean;
}

/** Bars for one property in one month, at half-day precision. Pass stays and blocks together. */
export function monthHalfSegments(bookings: Booking[], propertyId: string, year: number, month: number): HalfSegment[] {
  const from = firstOfMonth(year, month);
  const to = firstOfNextMonth(year, month);
  const days = daysBetween(from, to);
  return bookings
    .filter((b) => isActive(b) && b.propertyId === propertyId && b.checkIn < to && b.checkOut > from)
    .flatMap((b) => {
      const startsBefore = b.checkIn < from;
      const endsAfter = b.checkOut >= to;
      const startHalf = startsBefore ? 0 : 2 * (toDate(b.checkIn).getUTCDate() - 1) + 1;
      const endHalf = endsAfter ? 2 * days : 2 * (toDate(b.checkOut).getUTCDate() - 1) + 1;
      if (endHalf <= startHalf) return [];
      return [{ bookingId: b.id, label: b.guestName, status: b.status, kind: b.kind, startHalf, spanHalves: endHalf - startHalf, startsBefore, endsAfter }];
    })
    .sort((a, b) => a.startHalf - b.startHalf);
}

/** Days of the month where one guest leaves and another arrives on the same property. */
export function turnoverDays(bookings: Booking[], propertyId: string, from: string, to: string): string[] {
  const mine = bookings.filter((b) => isActive(b) && b.kind === "stay" && b.propertyId === propertyId);
  const arrivals = new Set(mine.map((b) => b.checkIn));
  return [...new Set(mine.filter((b) => arrivals.has(b.checkOut) && b.checkOut >= from && b.checkOut < to).map((b) => b.checkOut))].sort();
}

// ---------------------------------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------------------------------

/** What is still owed for a stay. Never negative. */
export const owed = (b: Pick<Booking, "amount" | "paid">): number => Math.max(0, b.amount - b.paid);

export type PaymentState = "unpriced" | "unpaid" | "partial" | "paid";
export function paymentState(b: Pick<Booking, "amount" | "paid">): PaymentState {
  if (b.amount <= 0) return "unpriced";
  if (b.paid <= 0) return "unpaid";
  return b.paid >= b.amount ? "paid" : "partial";
}

/** Live stays that still owe money, the ones arriving soonest first. */
export function pendingPayments(bookings: Booking[]): Booking[] {
  return bookings
    .filter((b) => isActive(b) && b.kind === "stay" && owed(b) > 0)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

export function paymentTotals(bookings: Booking[], from: string, to: string): { billed: number; collected: number; pending: number } {
  const live = bookings.filter((b) => isActive(b) && b.kind === "stay" && b.checkIn >= from && b.checkIn < to);
  const billed = live.reduce((s, b) => s + b.amount, 0);
  const collected = live.reduce((s, b) => s + Math.min(b.paid, b.amount), 0);
  return { billed, collected, pending: billed - collected };
}

// ---------------------------------------------------------------------------------------------------
// Today
// ---------------------------------------------------------------------------------------------------

export interface TodayPlan {
  arrivals: Booking[];
  departures: Booking[];
  tomorrowArrivals: Booking[];
  tasks: HostTask[];
  overdue: HostTask[];
  /** Arriving today or tomorrow with money still owed. */
  collect: Booking[];
}

/** One list for the day: who arrives, who leaves, what to clean, what to collect. */
export function todayPlan(bookings: Booking[], tasks: HostTask[], today: string): TodayPlan {
  const live = bookings.filter((b) => isActive(b) && b.kind === "stay");
  const tomorrow = addDays(today, 1);
  const open = tasks.filter((t) => !t.done);
  return {
    arrivals: live.filter((b) => b.checkIn === today && b.status !== "checked_out"),
    departures: live.filter((b) => b.checkOut === today),
    tomorrowArrivals: live.filter((b) => b.checkIn === tomorrow),
    tasks: open.filter((t) => t.dueOn === today),
    overdue: open.filter((t) => t.dueOn !== null && t.dueOn < today),
    collect: live.filter((b) => (b.checkIn === today || b.checkIn === tomorrow) && owed(b) > 0),
  };
}

/** The stays of one guest, newest first. Canceled ones are kept: the history is the history. */
export function guestStays(bookings: Booking[], key: string): Booking[] {
  return bookings.filter((b) => b.kind === "stay" && guestKeyOf(b) === key).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
}

export type GuestSegment = "vip" | "frequent" | "owes" | "incident";
export const GUEST_SEGMENTS: readonly GuestSegment[] = ["vip", "frequent", "owes", "incident"];

/** Labels a guest by what is true about them today: marked VIP, came more than once, still owes, has an incident on record. */
export function guestSegments(g: { key: string; stays: number }, bookings: Booking[], profile: { vip: boolean } | undefined, incidentKeys: ReadonlySet<string>): GuestSegment[] {
  const out: GuestSegment[] = [];
  if (profile?.vip) out.push("vip");
  if (g.stays >= 2) out.push("frequent");
  if (bookings.some((b) => b.kind === "stay" && isActive(b) && guestKeyOf(b) === g.key && owed(b) > 0)) out.push("owes");
  if (incidentKeys.has(g.key)) out.push("incident");
  return out;
}

/** "familia, vip ,Familia" -> ["familia", "vip"]. At most 10 tags of 30 characters, no repeats (the database enforces the same). */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim().slice(0, 30);
    const k = tag.toLowerCase();
    if (!tag || seen.has(k)) continue;
    seen.add(k);
    out.push(tag);
    if (out.length === 10) break;
  }
  return out;
}
