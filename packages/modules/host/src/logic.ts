import { addDays, daysBetween, firstOfMonth, firstOfNextMonth, toDate } from "./dates";
import type { Booking, BookingStatus, NewBooking } from "./types";

/** A canceled booking holds no dates and counts for nothing. */
export const isActive = (b: Pick<Booking, "status">): boolean => b.status !== "canceled";

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

/** Guests are not typed in twice: they are the people behind the bookings. Same email (or name) = same guest. */
export function guestsDirectory(bookings: Booking[]): GuestRecord[] {
  const map = new Map<string, GuestRecord & { latest: string }>();
  for (const b of [...bookings].sort((x, y) => x.checkIn.localeCompare(y.checkIn))) {
    if (!isActive(b)) continue;
    const key = (b.guestEmail.trim() || b.guestName.trim()).toLowerCase();
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
  const clash = existing.some(
    (b) => isActive(b) && b.propertyId === input.propertyId && b.checkIn < input.checkOut && input.checkIn < b.checkOut,
  );
  return clash ? "host.errOverlap" : null;
}
