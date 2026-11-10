import { en, type Messages } from "./en";

export type Locale = "en";
/** Add "es" and "pt" here (plus their catalogue files and a route) to open those languages. */
export const LOCALES: Locale[] = ["en"];
export const DEFAULT_LOCALE: Locale = "en";
export type { Messages };

const CATALOG: Record<Locale, Messages> = { en };
export const getMessages = (locale: Locale = DEFAULT_LOCALE): Messages => CATALOG[locale];

/** "{count} more apps" with variables. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Picks the "_one" / "_other" variant of a key for the locale's plural rules. */
export function plural(m: object, base: string, count: number, locale: Locale = DEFAULT_LOCALE): string {
  const rule = new Intl.PluralRules(locale).select(count);
  const bag = m as Record<string, unknown>;
  const s = (bag[`${base}_${rule}`] ?? bag[`${base}_other`] ?? "") as string;
  return fmt(s, { count });
}
