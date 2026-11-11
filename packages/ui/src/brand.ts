/** Names and taglines of every Stayflow product. The accent color is chosen by each user (see themes). */
export const PRODUCT_BRAND = {
  profit: { name: "Stayflow Business", tagline: "Descubre cuánto ganas de verdad." },
  guest: { name: "Stayflow Guest", tagline: "Una bienvenida cálida, antes de que lleguen." },
  host: { name: "Stayflow Host", tagline: "Todo tu alquiler, en un solo lugar." },
  ai: { name: "Stayflow AI", tagline: "Tu asistente para hablar con cada huésped." },
  operations: { name: "Stayflow Operations", tagline: "Cada propiedad, siempre lista." },
  listing: { name: "Stayflow Listing", tagline: "Presenta mejor tu alojamiento." },
  experiences: { name: "Stayflow Experiences", tagline: "Lo mejor del destino, a un toque." },
  website: { name: "Stayflow Website", tagline: "Tu propio sitio, sin depender de nadie." },
  suite: { name: "Stayflow Suite", tagline: "Todo lo que tu alquiler necesita. Conectado." },
} as const;

/** Parent brand. Shown as an endorsement ("Un producto de"), never as an app icon. */
export const STUDIO_BRAND = { name: "Digital Studio", black: "#0B0B0C", white: "#FFFFFF" } as const;
