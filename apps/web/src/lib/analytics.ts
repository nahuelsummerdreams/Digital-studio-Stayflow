/**
 * Conversion events go to `window.dataLayer`, which Google Tag Manager, GA4 or any other tool can read.
 * Nothing is sent anywhere until a tag manager is installed, and no personal data is ever included.
 */
import { metaEvent } from "./meta";

type Event = "view_item" | "add_to_cart" | "remove_from_cart" | "view_cart" | "begin_checkout" | "generate_lead" | "select_promotion";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: Event, data: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  try {
    (window.dataLayer ??= []).push({ event, ...data });
  } catch {
    /* analytics must never break the page */
  }
  metaEvent(event, data);
}
