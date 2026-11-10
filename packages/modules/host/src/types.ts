export const BOOKING_STATUSES = ["confirmed", "checked_in", "checked_out", "canceled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_SOURCES = ["airbnb", "booking", "vrbo", "direct", "other"] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];

/** Dates are plain "YYYY-MM-DD" strings: no time zones involved. */
export interface Booking {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  source: BookingSource;
  status: BookingStatus;
  /** Integer minor units (cents). */
  amount: number;
  notes: string;
}

export interface NewBooking {
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  source: BookingSource;
  amount: number;
  notes: string;
}

export interface HostTask {
  id: string;
  propertyId: string | null;
  title: string;
  dueOn: string | null;
  done: boolean;
}
