import { es, type Messages } from "./es";

export type Locale = "es";
/** Add "en" and "pt" here (plus their catalogue files) to open those languages. */
export const LOCALES: Locale[] = ["es"];
export const DEFAULT_LOCALE: Locale = "es";
export type { Messages };

const CATALOG: Record<Locale, Messages> = { es };
export const getMessages = (locale: Locale = DEFAULT_LOCALE): Messages => CATALOG[locale];

/** "{count} apps más", con variables. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Elige la variante "_one" / "_other" de una clave según las reglas de plural del idioma. */
export function plural(m: object, base: string, count: number, locale: Locale = DEFAULT_LOCALE): string {
  const rule = new Intl.PluralRules(locale).select(count);
  const bag = m as Record<string, unknown>;
  const s = (bag[`${base}_${rule}`] ?? bag[`${base}_other`] ?? "") as string;
  return fmt(s, { count });
}
