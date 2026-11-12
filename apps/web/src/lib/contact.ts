/** How a visitor reaches a person before paying. Both are optional: a channel that is not configured is simply not shown (never a placeholder). */
const digits = (v: string) => v.replace(/\D/g, "");

export const WHATSAPP = digits(process.env.NEXT_PUBLIC_WHATSAPP ?? "");
export const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim();

/** The best way to talk to us right now, or null when none is configured. */
export function contactHref(message: string): string | null {
  if (WHATSAPP.length >= 8) return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  if (CONTACT_EMAIL) return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Consulta sobre Stayflow")}&body=${encodeURIComponent(message)}`;
  return null;
}
