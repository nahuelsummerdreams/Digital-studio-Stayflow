"use client";

import { useEffect, useState } from "react";
import { useT } from "@stayflow/i18n";
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY, isThemeId, type ThemeId } from "./themes";

/** Three accent dots. The choice is remembered on this device. */
export function ThemeSwitcher() {
  const t = useT();
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (isThemeId(current)) setTheme(current);
  }, []);

  function choose(id: ThemeId) {
    const apply = () => {
      setTheme(id);
      document.documentElement.setAttribute("data-theme", id);
    };
    // Cross-fade the whole accent change where the browser supports it.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) doc.startViewTransition(apply);
    else apply();
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* The theme still applies for this visit. */
    }
  }

  return (
    <div role="radiogroup" aria-label={t("common.accentColor")} className="flex items-center gap-2">
      {THEMES.map((th) => {
        const active = theme === th.id;
        return (
          <button
            key={th.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(`themes.${th.id}`)}
            title={t(`themes.${th.id}`)}
            onClick={() => choose(th.id)}
            style={{ backgroundColor: th.swatch }}
            className={`h-5 w-5 rounded-full transition ${
              active ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : "opacity-60 hover:opacity-100"
            }`}
          />
        );
      })}
    </div>
  );
}
