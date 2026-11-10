import type { Config } from "tailwindcss";
import { stayflowPreset } from "@stayflow/ui/preset";

export default {
  presets: [stayflowPreset],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
} satisfies Config;
