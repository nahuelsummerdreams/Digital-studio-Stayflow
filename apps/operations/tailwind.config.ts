import type { Config } from "tailwindcss";
import { stayflowPreset } from "@stayflow/ui/preset";

export default {
  presets: [stayflowPreset],
  // Shared packages ship their own screens, so Tailwind must scan them too.
  content: ["./src/**/*.{ts,tsx}", "../../packages/*/src/**/*.{ts,tsx}", "../../packages/modules/*/src/**/*.{ts,tsx}"],
} satisfies Config;
