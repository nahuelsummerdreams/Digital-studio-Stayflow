/**
 * Stayflow theming. The base is always dark; a theme only swaps the accent.
 * Values are "R G B" channels so Tailwind opacity modifiers work (bg-accent/10).
 */
export const THEMES = [
  { id: "blue", label: "Electric blue", swatch: "#2F7BFF" },
  { id: "green", label: "Neon green", swatch: "#39FF88" },
  { id: "coral", label: "Coral", swatch: "#FF385C" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "blue";
export const THEME_STORAGE_KEY = "stayflow-theme";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

/** CSS for every app: put it in the global stylesheet via `@import` or paste as-is. */
export const THEME_CSS = `
:root {
  --bg: 6 10 19;
  --surface: 13 19 33;
  --surface-2: 19 27 46;
  --line: 32 42 68;
  --fg: 240 244 250;
  --muted: 139 151 173;
  --danger: 255 107 129;
  --success: 52 227 161;
  --accent: 47 123 255;
  --accent-2: 34 211 166;
  --on-accent: 255 255 255;
}
:root[data-theme="green"] {
  --accent: 57 255 136;
  --accent-2: 182 255 60;
  --on-accent: 4 19 10;
}
:root[data-theme="coral"] {
  --accent: 255 56 92;
  --accent-2: 255 138 92;
  --on-accent: 255 255 255;
}
`;

/**
 * Runs before first paint (inline <script>) so the saved theme never flashes.
 * Storage can be unavailable (private mode), so every access is guarded.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(${JSON.stringify(THEMES.map((t) => t.id))}.indexOf(t)>-1){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;
