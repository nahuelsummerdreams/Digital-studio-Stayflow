"use client";

import { LOCALES, useI18n } from "@stayflow/i18n";
import { activeTabClass, idleTabClass } from "@stayflow/ui";

/**
 * Lets the visitor pick the language of the app. Shows nothing where the language is fixed
 * (the apps that are still Spanish-only), so it is safe to place on any screen.
 */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  if (!setLocale) return null;
  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-xl border border-line p-0.5 ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          aria-pressed={locale === l.code}
          onClick={() => setLocale(l.code)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${locale === l.code ? activeTabClass : idleTabClass}`}
        >
          {l.native}
        </button>
      ))}
    </div>
  );
}
