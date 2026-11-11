import { phoneDigits, shortDate } from "./format";
import type { Booking } from "./types";

export const TEMPLATE_KINDS = ["welcome", "arrival", "reminder", "thanks"] as const;
export type TemplateKind = (typeof TEMPLATE_KINDS)[number];

/** Variables a template can use, written {nombre}. */
export const TEMPLATE_VARS = ["nombre", "propiedad", "entrada", "salida", "noches", "huespedes", "guia"] as const;

export const DEFAULT_TEMPLATES: Record<TemplateKind, string> = {
  welcome: "Hola {nombre}, ¡gracias por reservar {propiedad}! Te esperamos del {entrada} al {salida} ({noches} noches). Cualquier duda antes de llegar, escríbeme por aquí.",
  arrival: "Hola {nombre}, mañana es tu llegada a {propiedad}. Aquí tienes todo lo que necesitas (acceso, Wi-Fi, reglas y recomendaciones): {guia}\nEl check-in es después del mediodía. ¡Buen viaje!",
  reminder: "Hola {nombre}, te recuerdo que tu salida de {propiedad} es el {salida} antes del mediodía. Si necesitas un poco más de tiempo, avísame y vemos. ¡Gracias por tu estadía!",
  thanks: "Hola {nombre}, gracias por alojarte en {propiedad}. Ojalá hayas disfrutado la estadía. Si te gustó, una reseña nos ayuda muchísimo. ¡Te esperamos de vuelta!",
};

export interface TemplateContext {
  booking: Pick<Booking, "guestName" | "checkIn" | "checkOut" | "nights" | "guestsCount">;
  propertyName: string;
  /** Public Stayflow Guest link of the property, if its guide is published. */
  guideUrl?: string | null;
  locale?: string;
}

/** Fills {variables}. Unknown ones are left as they are so a typo is visible. A missing guide link drops that line's variable cleanly. */
export function renderTemplate(body: string, ctx: TemplateContext): string {
  const first = ctx.booking.guestName.trim().split(/\s+/)[0] ?? "";
  const values: Record<(typeof TEMPLATE_VARS)[number], string> = {
    nombre: first,
    propiedad: ctx.propertyName,
    entrada: shortDate(ctx.booking.checkIn, ctx.locale ?? "es"),
    salida: shortDate(ctx.booking.checkOut, ctx.locale ?? "es"),
    noches: String(ctx.booking.nights),
    huespedes: String(ctx.booking.guestsCount),
    guia: ctx.guideUrl ?? "",
  };
  return body
    .replace(/\{(\w+)\}/g, (all, key: string) => (key in values ? values[key as keyof typeof values] : all))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/: *\n/g, ":\n")
    .trim();
}

export const whatsappUrl = (phone: string, text: string): string => `https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(text)}`;
export const mailtoUrl = (email: string, subject: string, text: string): string => `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
