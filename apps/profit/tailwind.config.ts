import type { Config } from "tailwindcss";
import { stayflowPreset } from "@stayflow/ui";

export default {
  presets: [stayflowPreset],
  content: ["./src/**/*.{ts,tsx}"],
} satisfies Config;
