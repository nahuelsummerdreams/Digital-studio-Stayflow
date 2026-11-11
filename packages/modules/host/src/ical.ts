import { addDays } from "./dates";
import type { Booking, BookingSource } from "./types";

/** One calendar event reduced to what Host needs: an id, a stay's dates (end exclusive) and a label. */
export interface IcalEvent {
  uid: string;
  start: string;
  end: string;
  summary: string;
}

const unfold = (text: string) => text.replace(/\r?\n[ \t]/g, "");
const unescape = (v: string) => v.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1");

/** "20261009" or "20261009T150000Z" -> "2026-10-09". Anything else is ignored. */
function toIsoDate(value: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(value.trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Reads the VEVENTs of an .ics file. Tolerant: skips anything it cannot understand. */
export function parseIcal(text: string): IcalEvent[] {
  const out: IcalEvent[] = [];
  const lines = unfold(text).split(/\r?\n/);
  let cur: Partial<IcalEvent> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") {
      if (cur?.uid && cur.start) {
        const end = cur.end ?? addDays(cur.start, 1);
        if (end > cur.start) out.push({ uid: cur.uid, start: cur.start, end, summary: cur.summary ?? "" });
      }
      cur = null;
    } else if (cur) {
      const i = line.indexOf(":");
      if (i < 0) continue;
      const name = line.slice(0, i).split(";")[0]?.toUpperCase();
      const value = line.slice(i + 1);
      if (name === "UID") cur.uid = value.trim().slice(0, 300);
      else if (name === "DTSTART") cur.start = toIsoDate(value) ?? undefined;
      else if (name === "DTEND") cur.end = toIsoDate(value) ?? undefined;
      else if (name === "SUMMARY") cur.summary = unescape(value).trim().slice(0, 120);
    }
  }
  return out;
}

/** "Not available", "Blocked", "Closed"... are holds, not guests. */
export const isBlockSummary = (summary: string): boolean => /not available|unavailable|blocked|bloquead|no disponible|closed|cerrad/i.test(summary);

export function sourceFromUrl(url: string): BookingSource {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (host.includes("airbnb")) return "airbnb";
  if (host.includes("booking.com")) return "booking";
  if (host.includes("vrbo") || host.includes("homeaway")) return "vrbo";
  return "other";
}

export interface SyncPlan {
  insert: { uid: string; start: string; end: string; name: string; kind: "stay" | "block" }[];
  update: { id: string; start: string; end: string; name: string; reopen: boolean }[];
  cancel: { id: string }[];
}

/**
 * Compares what the other calendar says with what Host already imported.
 * - new events are inserted; moved ones updated; ones that vanished (and have not started) are canceled.
 * - Only bookings that came from a calendar (`externalUid`) are ever touched. Yours stay yours.
 */
export function planSync(imported: Booking[], events: IcalEvent[], today: string, importedLabel: string): SyncPlan {
  const byUid = new Map(imported.filter((b) => b.externalUid).map((b) => [b.externalUid as string, b]));
  const seen = new Set<string>();
  const plan: SyncPlan = { insert: [], update: [], cancel: [] };
  for (const e of events) {
    if (e.end < today) continue; // history is not worth importing
    seen.add(e.uid);
    const kind = isBlockSummary(e.summary) ? "block" : "stay";
    const name = kind === "block" ? e.summary || "Bloqueado" : importedLabel;
    const found = byUid.get(e.uid);
    if (!found) plan.insert.push({ uid: e.uid, start: e.start, end: e.end, name, kind });
    else if (found.checkIn !== e.start || found.checkOut !== e.end || found.status === "canceled") plan.update.push({ id: found.id, start: e.start, end: e.end, name: found.guestName || name, reopen: found.status === "canceled" });
  }
  for (const [uid, b] of byUid) {
    if (!seen.has(uid) && b.status === "confirmed" && b.checkIn >= today) plan.cancel.push({ id: b.id });
  }
  return plan;
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const ymd = (iso: string) => iso.replace(/-/g, "");

/** Builds the .ics other platforms read to block your dates. Dates only: no guest names, no money. */
export function buildIcal(propertyName: string, events: { uid: string; checkIn: string; checkOut: string; block: boolean }[], now: Date = new Date()): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Stayflow//Host//ES", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${propertyName.replace(/[\r\n,;]/g, " ")}`];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}@stayflow`, `DTSTAMP:${stamp(now)}`, `DTSTART;VALUE=DATE:${ymd(e.checkIn)}`, `DTEND;VALUE=DATE:${ymd(e.checkOut)}`, `SUMMARY:${e.block ? "Bloqueado" : "Reservado"}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** True for addresses a server must never be tricked into calling (loopback, private, link-local, metadata). */
export function isPrivateAddress(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v.includes(":")) {
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
    return mapped ? isPrivateAddress(mapped[1] as string) : false;
  }
  const p = v.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p as [number, number, number, number];
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}
