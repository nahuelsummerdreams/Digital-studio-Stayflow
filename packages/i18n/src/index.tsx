"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, isLocale, pickLocale, translate, type Locale, type MessageKey, type TFn } from "./core";

interface I18nState {
  locale: Locale;
  t: TFn;
  /** Present only where the visitor may choose a language (see `detect` on the provider). */
  setLocale?: (locale: Locale) => void;
}

const STORAGE_KEY = "stayflow-locale";

// Works without a provider (tests, isolated components): falls back to the default language.
const I18nContext = createContext<I18nState>({
  locale: DEFAULT_LOCALE,
  t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
});

/**
 * `locale` is the fixed language. With `detect`, the visitor's choice (saved in this browser) wins; without a saved choice the
 * browser's own language is used when it is offered, otherwise English. Without `detect` the language never changes,
 * which is what the apps that are still Spanish-only rely on.
 */
export function I18nProvider({ locale = DEFAULT_LOCALE, detect = false, children }: { locale?: Locale; detect?: boolean; children: ReactNode }) {
  const [current, setCurrent] = useState<Locale>(locale);

  useEffect(() => {
    if (!detect) return;
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* private mode: just follow the browser */
    }
    setCurrent(isLocale(saved) ? saved : pickLocale(navigator.languages?.length ? navigator.languages : [navigator.language]));
  }, [detect]);

  useEffect(() => {
    if (detect) document.documentElement.lang = current;
  }, [detect, current]);

  const setLocale = useCallback((next: Locale) => {
    setCurrent(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the choice then lasts until the page is closed */
    }
  }, []);

  const t = useCallback<TFn>((key, vars) => translate(current, key, vars), [current]);
  const value = useMemo<I18nState>(() => (detect ? { locale: current, t, setLocale } : { locale: current, t }), [detect, current, t, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  return useContext(I18nContext);
}

export function useT(): TFn {
  return useContext(I18nContext).t;
}

export { errorKey } from "./errors";
export { HELP_ROUTES, POPULAR_TOPICS, STRONG_SCORE, helpKnowledge, helpSystemPrompt, helpTopic, helpTopics, matchHelp } from "./help";
export type { HelpMatch, HelpTopic, HelpTopicId } from "./help";

export { DEFAULT_LOCALE, LOCALES, isLocale, pickLocale, translate } from "./core";
export type { Locale, Messages, MessageKey, TFn, Vars } from "./core";
