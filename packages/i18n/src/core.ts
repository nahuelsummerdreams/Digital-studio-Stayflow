import { es, type Messages } from "./es";

export type Locale = "es";
export const DEFAULT_LOCALE: Locale = "es";
/** Add a language here (and its file) to make it available. `en` comes next. */
const CATALOG: Record<Locale, Messages> = { es };

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
