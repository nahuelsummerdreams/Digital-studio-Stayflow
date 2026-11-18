import { describe, expect, it } from "vitest";
import { errorKey } from "./errors";
import { en } from "./en";
import { es } from "./es";
import { LOCALES, isLocale, pickLocale, translate } from "./index";
import { pt } from "./pt";

describe("translate", () => {
  it("returns plain text and fills variables", () => {
    expect(translate("es", "auth.signIn")).toBe("Iniciar sesión");
    expect(translate("es", "activate.title", { product: "Stayflow Business" })).toBe("Activa Stayflow Business");
  });
  it("picks singular and plural by count", () => {
    expect(translate("es", "entries.nights", { count: 1 })).toBe("1 noche");
    expect(translate("es", "entries.nights", { count: 5 })).toBe("5 noches");
    expect(translate("es", "entries.nights", { count: 0 })).toBe("0 noches");
    expect(translate("es", "entries.nights", { count: 2 })).toBe("2 noches");
  });
  it("leaves unknown placeholders visible instead of printing undefined", () => {
    expect(translate("es", "activate.title")).toBe("Activa {product}");
  });
  it("shows the key itself when a translation is missing", () => {
    expect(translate("es", "nope.missing" as never)).toBe("nope.missing");
  });
});

describe("errorKey", () => {
  it("maps Supabase auth codes", () => {
    expect(errorKey({ code: "invalid_credentials", message: "x" })).toBe("errors.invalidCredentials");
    expect(errorKey({ code: "user_already_exists" })).toBe("errors.userExists");
    expect(errorKey({ code: "over_email_send_rate_limit" })).toBe("errors.rateLimit");
  });
  it("maps permission and network failures", () => {
    expect(errorKey({ code: "42501" })).toBe("errors.noPermission");
    expect(errorKey({ message: 'new row violates row-level security policy for table "x"' })).toBe("errors.noPermission");
    expect(errorKey(new TypeError("Failed to fetch"))).toBe("errors.network");
  });
  it("never throws and always falls back to a generic message", () => {
    expect(errorKey(null)).toBe("errors.generic");
    expect(errorKey("boom")).toBe("errors.generic");
    expect(errorKey({ message: 42 })).toBe("errors.generic");
  });
});

type Tree = { [k: string]: string | string[] | Tree };
/** Every text of a catalogue with its path: ["host.alertLate_one", "Vencida hace {count} día"]. */
function leaves(node: Tree, path = ""): [string, string][] {
  return Object.entries(node).flatMap(([k, v]) => {
    const p = path ? `${path}.${k}` : k;
    if (typeof v === "string") return [[p, v] as [string, string]];
    if (Array.isArray(v)) return v.map((x, i) => [`${p}[${i}]`, x] as [string, string]);
    return leaves(v, p);
  });
}
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const pipes = (text: string) => text.split("|").length;

describe.each([
  ["en", en],
  ["pt", pt],
])("%s catalogue", (_code, catalogue) => {
  const source = new Map(leaves(es as unknown as Tree));
  const mine = new Map(leaves(catalogue as unknown as Tree));

  it("has exactly the same keys as the Spanish source (nothing missing, nothing extra)", () => {
    expect([...mine.keys()].sort()).toEqual([...source.keys()].sort());
  });
  it("uses the same {placeholders} as the Spanish source in every text, so no value is lost", () => {
    const bad = [...source].filter(([k, v]) => placeholders(v) !== placeholders(mine.get(k) ?? "")).map(([k]) => k);
    expect(bad).toEqual([]);
  });
  it("keeps the same number of items in the lists separated by | (steps, features)", () => {
    const bad = [...source].filter(([k, v]) => v.includes("|") && pipes(v) !== pipes(mine.get(k) ?? "")).map(([k]) => k);
    expect(bad).toEqual([]);
  });
  it("has no empty text", () => {
    expect([...mine].filter(([, v]) => v.trim() === "").map(([k]) => k)).toEqual([]);
  });
});

describe("languages", () => {
  it("translates and picks plurals in each offered language", () => {
    expect(translate("en", "auth.signIn")).toBe("Sign in");
    expect(translate("pt", "auth.signIn")).toBe("Entrar");
    expect(translate("en", "entries.nights", { count: 1 })).toBe("1 night");
    expect(translate("en", "entries.nights", { count: 3 })).toBe("3 nights");
    expect(translate("pt", "entries.nights", { count: 1 })).toBe("1 noite");
    // In Brazilian Portuguese zero takes the singular ("0 noite"), which is what Intl.PluralRules gives.
    expect(translate("pt", "entries.nights", { count: 0 })).toBe("0 noite");
    expect(translate("pt", "entries.nights", { count: 2 })).toBe("2 noites");
    expect(translate("en", "complete.home.hello", { name: "Ana" })).toBe("Hi, Ana");
  });
  it("offers English, Spanish and Portuguese, each with its own name", () => {
    expect(LOCALES.map((l) => l.code)).toEqual(["en", "es", "pt"]);
    expect(LOCALES.map((l) => l.native)).toEqual(["English", "Español", "Português"]);
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
  it("picks the first browser language that is offered, and English when none is", () => {
    expect(pickLocale(["pt-BR", "en-US"])).toBe("pt");
    expect(pickLocale(["fr-FR", "es-AR", "en"])).toBe("es");
    expect(pickLocale(["EN-gb"])).toBe("en");
    expect(pickLocale(["de-DE", "ja"])).toBe("en");
    expect(pickLocale([])).toBe("en");
    expect(pickLocale(undefined)).toBe("en");
  });
});
