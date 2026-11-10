"use client";

import { useEffect, useState } from "react";
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY, isThemeId, type ThemeId } from "./themes";

/** Three accent dots. The choice is remembered on this device. */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (isThemeId(current)) setTheme(current);
  }, []);

  function choose(id: ThemeId) {
    setTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* The theme still applies for this visit. */
    }
  }

  return (
    <div role="radiogroup" aria-label="Accent color" className="flex items-center gap-2">
      {THEMES.map((t) => {
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t.label}
            title={t.label}
            onClick={() => choose(t.id)}
            style={{ backgroundColor: t.swatch }}
            className={`h-5 w-5 rounded-full transition ${
              active ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : "opacity-60 hover:opacity-100"
            }`}
          />
        );
      })}
    </div>
  );
}
