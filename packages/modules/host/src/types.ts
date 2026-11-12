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
  /** ISO timestamp of when it was recorded. */
  createdAt: string;
  /** Integer minor units already collected from the guest (deposit or full payment). */
  paid: number;
  /** 'stay' is a guest; 'block' holds dates (maintenance, own use) and `guestName` is the reason. */
  kind: BookingKind;
  /** Set when the stay came from a synced calendar (Airbnb, Booking...). */
  externalUid: string | null;
}

export type BookingKind = "stay" | "block";

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
  /** Collected so far. */
  paid?: number;
  notes: string;
}

export interface HostTask {
  id: string;
  propertyId: string | null;
  title: string;
  dueOn: string | null;
  done: boolean;
  /** Set when the task was created for a booking (cleaning after check-out). */
  bookingId: string | null;
}

/** What the Host screens need to know about a property (photo included). */
export interface HostProperty {
  id: string;
  name: string;
  city?: string | null;
  photoUrl?: string | null;
  /** Set when this is a room or a bed that hangs from an establishment (hotel / hostel). */
  parentId?: string | null;
  unitKind?: UnitKind | null;
  roomCategory?: string | null;
  /** Suggested nightly rate, integer minor units. */
  baseRate?: number | null;
}

export const LODGING_TYPES = ["rental", "hotel", "hostel"] as const;
export type LodgingType = (typeof LODGING_TYPES)[number];
export type UnitKind = "room" | "bed";
