import { daysBetween } from "./dates";
import type { BookingSource } from "./types";

/** One reservation read from an Airbnb / Booking / spreadsheet export, already cleaned. */
export interface ImportRow {
  /** Stable id from the platform (confirmation code), or built from dates and name. Used to never import twice. */
  code: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  /** Integer minor units. */
  amount: number;
  guests: number;
  phone: string;
  email: string;
  listing: string;
  canceled: boolean;
}

export type DateOrder = "dmy" | "mdy";

export interface ParsedImport {
  rows: ImportRow[];
  /** Rows that had no usable dates. */
  invalid: number;
  /** Required columns that were not found ("start" | "end"). */
  missing: string[];
  /** True when 03/04/2026 could be read two ways and the file gave no hint. */
  ambiguous: boolean;
  order: DateOrder;
  source: BookingSource | null;
  listings: string[];
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** RFC 4180 reader that also copes with `;` and tab separators (Excel in Spanish uses `;`). */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const count = (c: string) => firstLine.split(c).length - 1;
  const delim = [";", "\t", ","].reduce((best, c) => (count(c) > count(best) ? c : best), ",");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as string;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** "$1,234.50", "USD 120", "1.234,50", "1 234,5" -> minor units. Null when there is no number. */
export function parseAmount(raw: string): number | null {
  const s = raw.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(s)) return null;
  const neg = s.startsWith("-");
  const body = s.replace(/-/g, "");
  const lastDot = body.lastIndexOf(".");
  const lastComma = body.lastIndexOf(",");
  let decimalAt = Math.max(lastDot, lastComma);
  if (decimalAt >= 0) {
    const sep = body[decimalAt] as string;
    const digitsAfter = body.length - decimalAt - 1;
    const occurrences = body.split(sep).length - 1;
    const otherSep = body.includes(sep === "." ? "," : ".");
    // "1,234" or "1.234.567" with only one kind of separator and groups of 3 are thousands, not decimals.
    if (!otherSep && digitsAfter === 3 && (occurrences > 1 || decimalAt <= 3)) decimalAt = -1;
  }
  let intPart: string;
  let frac = "";
  if (decimalAt < 0) intPart = body.replace(/[.,]/g, "");
  else {
    intPart = body.slice(0, decimalAt).replace(/[.,]/g, "");
    frac = body.slice(decimalAt + 1).replace(/[.,]/g, "");
  }
  const cents = Math.round(Number(`${intPart || "0"}.${frac || "0"}`) * 100);
  if (!Number.isFinite(cents)) return null;
  return neg ? -cents : cents;
}

const validDate = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};
const pad = (n: number) => String(n).padStart(2, "0");

/** ISO, or day/month/year or month/day/year with / - . separators. */
export function parseDate(raw: string, order: DateOrder): string | null {
  const s = raw.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return validDate(+m[1]!, +m[2]!, +m[3]!) ? `${m[1]}-${pad(+m[2]!)}-${pad(+m[3]!)}` : null;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?!\d)/.exec(s);
  if (!m) return null;
  const a = +m[1]!;
  const b = +m[2]!;
  const y = m[3]!.length === 2 ? 2000 + +m[3]! : +m[3]!;
  const [d, mo] = order === "dmy" ? [a, b] : [b, a];
  return validDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
}

/** Looks at every slash date: a first part above 12 means day first; a second part above 12 means month first. */
export function detectDateOrder(samples: string[]): { order: DateOrder; ambiguous: boolean } {
  let dmy = false;
  let mdy = false;
  let slashed = false;
  for (const s of samples) {
    const m = /^(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}/.exec(s.trim());
    if (!m) continue;
    slashed = true;
    if (+m[1]! > 12) dmy = true;
    if (+m[2]! > 12) mdy = true;
  }
  if (dmy && !mdy) return { order: "dmy", ambiguous: false };
  if (mdy && !dmy) return { order: "mdy", ambiguous: false };
  return { order: "dmy", ambiguous: slashed };
}

const ALIASES = {
  code: ["confirmationcode", "codigodeconfirmacion", "booknumber", "numerodereserva", "reservationid", "reservationnumber", "idreserva", "codigo"],
  guest: ["guestname", "nombredelhuesped", "guestnames", "bookedby", "huesped", "nombredelcliente", "nombre", "cliente", "guest"],
  start: ["startdate", "fechadeinicio", "checkin", "entrada", "arrival", "llegada", "fechadeentrada", "fechadellegada", "from", "desde"],
  end: ["enddate", "fechadefinalizacion", "checkout", "salida", "departure", "fechadesalida", "to", "hasta", "fechadefin"],
  amount: ["earnings", "ingresos", "grossearnings", "price", "precio", "total", "amount", "importe", "totalprice", "preciototal"],
  status: ["status", "estado"],
  listing: ["listing", "anuncio", "propiedad", "property", "alojamiento", "roomtype", "tipodehabitacion", "unit", "unidad"],
  phone: ["contact", "contacto", "phone", "telefono", "phonenumber", "celular"],
  email: ["email", "correo", "correoelectronico"],
  guestsTotal: ["persons", "personas", "numberofguests", "guests", "huespedes", "numerodehuespedes", "ndehuespedes"],
  adults: ["adults", "adultos", "ndeadultos", "ofadults", "numberofadults"],
  children: ["children", "ninos", "ndeninos", "ofchildren", "numberofchildren"],
} as const;

type Field = keyof typeof ALIASES;

function findColumns(header: string[]): Partial<Record<Field, number>> {
  const n = header.map(norm);
  const out: Partial<Record<Field, number>> = {};
  for (const field of Object.keys(ALIASES) as Field[]) {
    for (const alias of ALIASES[field]) {
      const i = n.indexOf(alias);
      if (i >= 0) {
        out[field] = i;
        break;
      }
    }
  }
  return out;
}

function detectSource(header: string[]): BookingSource | null {
  const n = header.map(norm);
  if (n.includes("confirmationcode") || n.includes("codigodeconfirmacion")) return "airbnb";
  if (n.includes("booknumber") || (n.includes("bookedby") && n.includes("commission"))) return "booking";
  return null;
}

const CANCELED = /cancel|no ?show|declin|rechaz|expir/i;

/** Turns an exported file into clean reservations. Never throws: what it cannot read is counted as `invalid`. */
export function readReservations(text: string, forcedOrder?: DateOrder): ParsedImport {
  const table = parseCsv(text);
  const header = table[0] ?? [];
  const cols = findColumns(header);
  const missing = (["start", "end"] as const).filter((k) => cols[k] === undefined);
  const body = table.slice(1);
  const cell = (r: string[], f: Field) => (cols[f] === undefined ? "" : (r[cols[f] as number] ?? "").trim());

  const dateSamples = body.flatMap((r) => [cell(r, "start"), cell(r, "end")]);
  const detected = detectDateOrder(dateSamples);
  const order = forcedOrder ?? detected.order;
  const ambiguous = forcedOrder ? false : detected.ambiguous;

  const rows: ImportRow[] = [];
  let invalid = 0;
  if (missing.length === 0) {
    for (const r of body) {
      const checkIn = parseDate(cell(r, "start"), order);
      const checkOut = parseDate(cell(r, "end"), order);
      if (!checkIn || !checkOut || checkOut <= checkIn || daysBetween(checkIn, checkOut) > 366) {
        invalid++;
        continue;
      }
      const guest = cell(r, "guest").slice(0, 120);
      const adults = Number.parseInt(cell(r, "adults"), 10);
      const children = Number.parseInt(cell(r, "children"), 10);
      const total = Number.parseInt(cell(r, "guestsTotal"), 10);
      const people = (Number.isFinite(adults) ? adults : 0) + (Number.isFinite(children) ? children : 0);
      const guests = Math.min(50, Math.max(1, people > 0 ? people : Number.isFinite(total) ? total : 1));
      const code = cell(r, "code").slice(0, 120) || `${checkIn}_${checkOut}_${norm(guest).slice(0, 40)}`;
      const status = cell(r, "status");
      rows.push({
        code,
        guest,
        checkIn,
        checkOut,
        amount: Math.max(0, parseAmount(cell(r, "amount")) ?? 0),
        guests,
        phone: cell(r, "phone").slice(0, 40),
        email: /@/.test(cell(r, "email")) ? cell(r, "email").slice(0, 160) : "",
        listing: cell(r, "listing").slice(0, 160),
        canceled: status !== "" && CANCELED.test(status),
      });
    }
  }
  return { rows, invalid, missing, ambiguous, order, source: detectSource(header), listings: [...new Set(rows.map((x) => x.listing).filter(Boolean))] };
}

/** Finds the property a listing name refers to: exact, then contained either way. */
export function matchProperty(listing: string, properties: { id: string; name: string }[]): string | null {
  const l = norm(listing);
  if (!l) return null;
  const exact = properties.find((p) => norm(p.name) === l);
  if (exact) return exact.id;
  const near = properties.find((p) => norm(p.name).length >= 4 && (l.includes(norm(p.name)) || norm(p.name).includes(l)));
  return near?.id ?? null;
}
