/**
 * Meta (Facebook / Instagram) Pixel, loaded only when a Pixel ID is configured AND the visitor accepted cookies.
 * Events reuse the same `track()` calls as the rest of the site, mapped to Meta's standard events.
 * Each event carries an eventID so the same conversion can later be confirmed from the server (Conversions API) without being counted twice.
 */
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
export const CONSENT_KEY = "stayflow-consent-v1";
export type Consent = "granted" | "denied" | null;

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[][]; loaded: boolean; version: string; push: unknown };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}
export function writeConsent(v: "granted" | "denied"): void {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* the choice still applies for this visit */
  }
}

let loaded = false;
export function loadPixel(): void {
  if (!PIXEL_ID || loaded || typeof window === "undefined") return;
  loaded = true;
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as Fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
    window.fbq = fbq;
    window._fbq = fbq;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

const MAP: Record<string, string> = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", generate_lead: "Lead" };

/** Sends the matching Meta standard event, if the pixel is running. Never throws. */
export function metaEvent(event: string, data: Record<string, unknown>): void {
  try {
    const name = MAP[event];
    if (!name || !loaded || !window.fbq) return;
    const params: Record<string, unknown> = { currency: "USD" };
    if (data.item_id) {
      params.content_ids = [String(data.item_id)];
      params.content_type = "product";
    }
    if (data.item_name) params.content_name = data.item_name;
    if (typeof data.price === "number") params.value = data.price;
    if (typeof data.value === "number") params.value = data.value;
    if (Array.isArray(data.items)) params.num_items = data.items.length;
    const eventID = `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.fbq("track", name, params, { eventID });
  } catch {
    /* tracking must never break the page */
  }
}
