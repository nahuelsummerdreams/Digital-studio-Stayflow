"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, translate, type Locale, type MessageKey, type TFn } from "./core";

interface I18nState {
  locale: Locale;
  t: TFn;
}

// Works without a provider (tests, isolated components): falls back to the default language.
const I18nContext = createContext<I18nState>({
  locale: DEFAULT_LOCALE,
  t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
});

export function I18nProvider({ locale = DEFAULT_LOCALE, children }: { locale?: Locale; children: ReactNode }) {
  const t = useCallback<TFn>((key, vars) => translate(locale, key, vars), [locale]);
  const value = useMemo(() => ({ locale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  return useContext(I18nContext);
}

export function useT(): TFn {
  return useContext(I18nContext).t;
}

export { errorKey } from "./errors";

export { DEFAULT_LOCALE, translate } from "./core";
export type { Locale, Messages, MessageKey, TFn, Vars } from "./core";
