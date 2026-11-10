/** Each app keeps its own accent, all share the Stayflow neutrals and type. */
export const PRODUCT_BRAND = {
  profit: { name: "Stayflow Profit", tagline: "Descubre cuánto ganas de verdad.", accent: "#2F7BFF" },
  guest: { name: "Stayflow Guest", tagline: "Una bienvenida cálida, antes de que lleguen.", accent: "#B45309" },
  host: { name: "Stayflow Host", tagline: "Todo tu alquiler, en un solo lugar.", accent: "#1D4ED8" },
  suite: { name: "Stayflow Suite", tagline: "Todo lo que tu alquiler necesita. Conectado.", accent: "#111827" },
} as const;

/** Parent brand. Shown as an endorsement ("A product by"), never as an app icon. */
export const STUDIO_BRAND = { name: "Digital Studio", black: "#0B0B0C", white: "#FFFFFF" } as const;
