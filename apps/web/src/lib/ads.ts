import type { ProductId } from "./catalog";

/** Ad landings: one promise, one product, one action. Copy avoids income claims (Meta policy). */
export const AD_IDS = ["host", "guest", "profit"] as const satisfies readonly ProductId[];
export type AdId = (typeof AD_IDS)[number];

export const ADS: Record<AdId, { hook: string; sub: string; points: [string, string, string]; cta: string }> = {
  host: {
    hook: "Todas tus reservas en un solo cronograma.",
    sub: "Deja de saltar entre apps y planillas. Ves quién llega, quién sale y qué fechas están libres, sin dobles reservas.",
    points: ["Cronograma visual de cada propiedad", "Una fecha ocupada no se puede reservar dos veces", "Alertas de lo que necesita atención hoy"],
    cta: "Quiero ordenar mis reservas",
  },
  guest: {
    hook: "Menos mensajes de huéspedes. Mejor llegada.",
    sub: "Una guía digital con QR: Wi-Fi, acceso, reglas y recomendaciones locales, siempre a mano para tu huésped.",
    points: ["Guía de cada propiedad con QR", "Check-in, Wi-Fi y reglas en un solo lugar", "Menos preguntas repetidas"],
    cta: "Quiero mi guía con QR",
  },
  profit: {
    hook: "Sabe cuánto te queda de cada propiedad.",
    sub: "Registra ingresos y gastos y mira el resultado por propiedad, sin hojas de cálculo.",
    points: ["Ingresos y gastos por propiedad", "Gastos recurrentes automáticos", "Resultado mensual claro"],
    cta: "Quiero ver mis números",
  },
};
