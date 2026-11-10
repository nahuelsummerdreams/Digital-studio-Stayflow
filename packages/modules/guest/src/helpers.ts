import { PLACE_CATEGORIES, type GuideFields, type GuideItem, type PlaceCategory } from "./types";

/** Digits only, without the "00" international prefix. "+34 600 123 456" -> "34600123456". */
export function phoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

/** A phone is only linkable when it has a country code and a plausible length (E.164: up to 15 digits). */
export function isLinkablePhone(phone: string): boolean {
  const d = phoneDigits(phone);
  return d.length >= 8 && d.length <= 15;
}

export function whatsappLink(phone: string): string | null {
  return isLinkablePhone(phone) ? `https://wa.me/${phoneDigits(phone)}` : null;
}

export function telLink(phone: string): string | null {
  return isLinkablePhone(phone) ? `tel:+${phoneDigits(phone)}` : null;
}

/**
 * Makes a typed link safe to store and open. "maps.google.com/x" -> "https://maps.google.com/x".
 * Anything that is not http(s) (javascript:, data:, mailto:...) is rejected.
 */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (raw === "") return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString().length <= 500 ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Public address of a guide. `base` is the origin where the guide app is served. */
export function guideUrl(base: string, slug: string): string {
  return `${base.replace(/\/+$/, "")}/g/${slug}`;
}

export function asCategory(value: string): PlaceCategory {
  return (PLACE_CATEGORIES as readonly string[]).includes(value) ? (value as PlaceCategory) : "other";
}

export type MissingKey = "wifi" | "checkin" | "checkout" | "rules" | "host" | "places" | "faq";

/** How finished a guide is, and what is still missing. Welcome + title always count as done by creation. */
export function completeness(g: GuideFields, items: Pick<GuideItem, "kind">[]): { pct: number; missing: MissingKey[] } {
  const checks: [MissingKey, boolean][] = [
    ["wifi", g.wifiName.trim() !== ""],
    ["checkin", g.checkin.trim() !== ""],
    ["checkout", g.checkout.trim() !== ""],
    ["rules", g.houseRules.trim() !== ""],
    ["host", g.hostName.trim() !== "" || g.hostPhone.trim() !== ""],
    ["places", items.some((i) => i.kind === "place")],
    ["faq", items.some((i) => i.kind === "faq")],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return { pct: Math.round((done / checks.length) * 100), missing: checks.filter(([, ok]) => !ok).map(([k]) => k) };
}

/** Places grouped by category, in the fixed order of PLACE_CATEGORIES; empty groups are dropped. */
export function groupPlaces<T extends { category: string }>(items: T[]): { category: PlaceCategory; items: T[] }[] {
  return PLACE_CATEGORIES.map((category) => ({ category, items: items.filter((i) => asCategory(i.category) === category) })).filter(
    (g) => g.items.length > 0,
  );
}
