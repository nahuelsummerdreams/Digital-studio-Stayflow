import { addDays } from "./dates";
import { isActive, movementsOn, occupancyPct } from "./logic";
import type { Booking, HostProperty, LodgingType } from "./types";

/** An establishment (top level) and its rooms; each room carries its beds (hostel only). */
export interface EstablishmentNode {
  property: HostProperty;
  rooms: { property: HostProperty; beds: HostProperty[] }[];
}

/** Groups flat properties into establishment > room > bed. Units whose parent is missing are ignored. */
export function establishmentTree(properties: HostProperty[]): EstablishmentNode[] {
  const byParent = new Map<string, HostProperty[]>();
  for (const p of properties) {
    if (!p.parentId) continue;
    byParent.set(p.parentId, [...(byParent.get(p.parentId) ?? []), p]);
  }
  return properties
    .filter((p) => !p.parentId)
    .map((property) => ({
      property,
      rooms: (byParent.get(property.id) ?? [])
        .filter((r) => r.unitKind === "room")
        .map((room) => ({ property: room, beds: (byParent.get(room.id) ?? []).filter((b) => b.unitKind === "bed") })),
    }));
}

/**
 * The properties that are actually reserved, by lodging type:
 * rental -> every top-level property; hotel -> rooms; hostel -> beds, or the room itself when it has none (private room).
 * Containers that only hold units are never reserved and never count for occupancy.
 */
export function bookableIds(properties: HostProperty[], type: LodgingType): string[] {
  if (type === "rental" || type === "cabins") return properties.filter((p) => !p.parentId).map((p) => p.id);
  const ids: string[] = [];
  for (const est of establishmentTree(properties)) {
    for (const room of est.rooms) {
      if (type === "hostel" && room.beds.length > 0) ids.push(...room.beds.map((b) => b.id));
      else ids.push(room.property.id);
    }
  }
  return ids;
}

export interface ReceptionDay {
  day: string;
  arrivals: Booking[];
  departures: Booking[];
  /** Stays spending the night of `day` (checked in before, leaving after). */
  inHouse: Booking[];
  /** Units reserved the night of `day`, over the units that can be reserved. */
  occupiedUnits: number;
  totalUnits: number;
  occupancyPct: number;
}

/** What reception needs for one day: arrivals, departures, who is in the house and how full it is. */
export function receptionDay(bookings: Booking[], properties: HostProperty[], type: LodgingType, day: string): ReceptionDay {
  const ids = bookableIds(properties, type);
  const set = new Set(ids);
  const mine = bookings.filter((b) => set.has(b.propertyId) && b.kind === "stay");
  const { arrivals, departures } = movementsOn(mine, day);
  const inHouse = mine.filter((b) => isActive(b) && b.checkIn <= day && b.checkOut > day);
  const occupiedUnits = new Set(inHouse.map((b) => b.propertyId)).size;
  return {
    day,
    arrivals,
    departures,
    inHouse,
    occupiedUnits,
    totalUnits: ids.length,
    occupancyPct: occupancyPct(mine, ids, day, addDays(day, 1)),
  };
}

/** Average nightly rate actually booked in [from, to) across the reservable units, integer minor units. */
export function averageDailyRate(bookings: Booking[], properties: HostProperty[], type: LodgingType, from: string, to: string): number {
  const set = new Set(bookableIds(properties, type));
  let revenue = 0;
  let nights = 0;
  for (const b of bookings) {
    if (!set.has(b.propertyId) || b.kind !== "stay" || !isActive(b) || b.nights <= 0) continue;
    const start = b.checkIn > from ? b.checkIn : from;
    const end = b.checkOut < to ? b.checkOut : to;
    const n = Math.max(0, (Date.parse(end) - Date.parse(start)) / 86_400_000);
    if (n === 0) continue;
    revenue += Math.round((b.amount / b.nights) * n);
    nights += n;
  }
  return nights === 0 ? 0 : Math.round(revenue / nights);
}

export interface CategorySnapshot {
  /** Reservable units (properties, cabins, rooms or beds, depending on the category). */
  units: number;
  occupiedToday: number;
  occupancyToday: number;
  arrivalsToday: number;
  departuresToday: number;
  /** Average nightly rate over the month, minor units. */
  adr: number;
  /** Revenue per available unit-night over the month, minor units (RevPAR for hotels, RevPAB for hostels). */
  revPau: number;
}

/** Headline numbers for the category band, over the reservable unit ids (already resolved by category). */
export function categorySnapshot(bookings: Booking[], unitIds: string[], day: string, monthFrom: string, monthTo: string): CategorySnapshot {
  const set = new Set(unitIds);
  const mine = bookings.filter((b) => set.has(b.propertyId) && b.kind === "stay");
  const { arrivals, departures } = movementsOn(mine, day);
  const inHouse = mine.filter((b) => isActive(b) && b.checkIn <= day && b.checkOut > day);
  let revenue = 0;
  let nights = 0;
  for (const b of mine) {
    if (!isActive(b) || b.nights <= 0) continue;
    const start = b.checkIn > monthFrom ? b.checkIn : monthFrom;
    const end = b.checkOut < monthTo ? b.checkOut : monthTo;
    const n = Math.max(0, (Date.parse(end) - Date.parse(start)) / 86_400_000);
    if (n === 0) continue;
    revenue += Math.round((b.amount / b.nights) * n);
    nights += n;
  }
  const span = Math.max(1, (Date.parse(monthTo) - Date.parse(monthFrom)) / 86_400_000);
  const available = unitIds.length * span;
  return {
    units: unitIds.length,
    occupiedToday: new Set(inHouse.map((b) => b.propertyId)).size,
    occupancyToday: unitIds.length === 0 ? 0 : Math.round((new Set(inHouse.map((b) => b.propertyId)).size / unitIds.length) * 100),
    arrivalsToday: arrivals.length,
    departuresToday: departures.length,
    adr: nights === 0 ? 0 : Math.round(revenue / nights),
    revPau: available === 0 ? 0 : Math.round(revenue / available),
  };
}
