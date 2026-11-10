/** Each app keeps its own accent, all share the Stayflow neutrals and type. */
export const PRODUCT_BRAND = {
  profit: { name: "Stayflow Profit", tagline: "Know what you really earn.", accent: "#2F7BFF" },
  guest: { name: "Stayflow Guest", tagline: "A warm welcome, before they knock.", accent: "#B45309" },
  host: { name: "Stayflow Host", tagline: "Your whole rental, one place.", accent: "#1D4ED8" },
  suite: { name: "Stayflow Suite", tagline: "Everything your rental needs. Connected.", accent: "#111827" },
} as const;

/** Parent brand. Shown as an endorsement ("A product by"), never as an app icon. */
export const STUDIO_BRAND = { name: "Digital Studio", black: "#0B0B0C", white: "#FFFFFF" } as const;
