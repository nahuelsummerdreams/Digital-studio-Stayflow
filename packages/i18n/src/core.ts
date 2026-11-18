import { en } from "./en";
import { es, type Messages } from "./es";
import { pt } from "./pt";

export type Locale = "es" | "en" | "pt";
/** The language of the source texts. Also the fallback when a visitor's language is not offered. */
export const DEFAULT_LOCALE: Locale = "es";
/**
 * Languages the apps are offered in. To add one: write `<code>.ts` typed as `Messages` (the compiler lists what is missing),
 * add it to CATALOG and to this list. Anything not here falls back to English for strangers and to Spanish for the code base.
 */
export const LOCALES: { code: Locale; name: string; native: string }[] = [
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "pt", name: "Portuguese", native: "Português" },
];
const CATALOG: Record<Locale, Messages> = { es, en, pt };

/** All the texts of one language (the help bot reads its topics from here). */
export const messagesFor = (locale: Locale): Messages => CATALOG[locale];

/** The best offered language for a list of browser languages (`navigator.languages`). English when none matches. */
export function pickLocale(preferred: readonly string[] | undefined | null): Locale {
  for (const raw of preferred ?? []) {
    const base = raw.toLowerCase().split("-")[0];
    const hit = LOCALES.find((l) => l.code === base);
    if (hit) return hit.code;
  }
  return "en";
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((l) => l.code === value);
}

type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
type PluralBase<K extends string> = K extends `${infer B}_${"one" | "other" | "zero" | "few" | "many"}` ? B : K;
/** Every translatable key. Plural variants are addressed by their base ("entries.nights"). */
export type MessageKey = PluralBase<Paths<typeof es>>;

export type Vars = Record<string, string | number>;
export type TFn = (key: MessageKey, vars?: Vars) => string;

function resolve(messages: Messages, path: string): string | undefined {
  let node: unknown = messages;
  for (const part of path.split(".")) {
    if (node && typeof node === "object" && part in node) node = (node as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  const messages = CATALOG[locale];
  let raw: string | undefined;
  if (vars && typeof vars.count === "number") {
    const rule = new Intl.PluralRules(locale).select(vars.count);
    raw = resolve(messages, `${key}_${rule}`) ?? resolve(messages, `${key}_other`);
  }
  raw ??= resolve(messages, key);
  // A missing key shows its own name: ugly but visible, never blank.
  if (raw === undefined) return key;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => (vars && name in vars ? String(vars[name]) : `{${name}}`));
}

export type { Messages } from "./es";
