import { translate, type MessageKey, type TFn } from "@stayflow/i18n/core";
import type { GuideTranslations, PublicGuide } from "./types";

export const GUIDE_LANGS = ["es", "en", "pt"] as const;
export type GuideLang = (typeof GUIDE_LANGS)[number];
export const GUIDE_LANG_NAMES: Record<GuideLang, string> = { es: "Español", en: "English", pt: "Português" };

/** ?lang=en wins; otherwise the first supported language in the browser's Accept-Language; otherwise Spanish. */
export function pickGuideLang(query: string | undefined, acceptLanguage: string | null | undefined): GuideLang {
  const q = (query ?? "").toLowerCase().slice(0, 2);
  if ((GUIDE_LANGS as readonly string[]).includes(q)) return q as GuideLang;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const code = part.trim().toLowerCase().slice(0, 2);
    if ((GUIDE_LANGS as readonly string[]).includes(code)) return code as GuideLang;
  }
  return "es";
}

/** The fixed labels of the public guide. Spanish lives in the main catalog; these cover the other languages. */
const LABELS: Record<Exclude<GuideLang, "es">, Record<string, string>> = {
  en: {
    "guide.wifi": "Wi-Fi", "guide.network": "Network", "guide.password": "Password", "guide.copy": "Copy", "guide.copied": "Copied",
    "guide.checkin": "Check-in", "guide.checkout": "Check-out", "guide.rules": "House rules", "guide.safety": "Safety",
    "guide.contact": "Your host", "guide.whatsapp": "Message on WhatsApp", "guide.call": "Call", "guide.places": "Things to do & places to eat",
    "guide.appliances": "How to use the house", "guide.faq": "Frequently asked questions", "guide.see": "View",
    "guide.cat.restaurant": "Restaurants", "guide.cat.activity": "Activities", "guide.cat.transport": "Transport", "guide.cat.shop": "Shopping", "guide.cat.other": "Other",
    "guide.hostedBy": "Host: {name}", "guide.notFoundTitle": "This guide is not available",
    "guide.notFoundBody": "The link may have changed or the guide is no longer active. Ask your host for the new link.",
    "guide.poweredBy": "Made with Stayflow Guest",
  },
  pt: {
    "guide.wifi": "Wi-Fi", "guide.network": "Rede", "guide.password": "Senha", "guide.copy": "Copiar", "guide.copied": "Copiado",
    "guide.checkin": "Check-in", "guide.checkout": "Check-out", "guide.rules": "Regras da casa", "guide.safety": "Segurança",
    "guide.contact": "Seu anfitrião", "guide.whatsapp": "Escrever pelo WhatsApp", "guide.call": "Ligar", "guide.places": "O que fazer e onde comer",
    "guide.appliances": "Como usar a casa", "guide.faq": "Perguntas frequentes", "guide.see": "Ver",
    "guide.cat.restaurant": "Restaurantes", "guide.cat.activity": "Atividades", "guide.cat.transport": "Transporte", "guide.cat.shop": "Compras", "guide.cat.other": "Outros",
    "guide.hostedBy": "Anfitrião: {name}", "guide.notFoundTitle": "Este guia não está disponível",
    "guide.notFoundBody": "O link pode ter mudado ou o guia não está mais ativo. Peça o novo link ao seu anfitrião.",
    "guide.poweredBy": "Criado com Stayflow Guest",
  },
};

/** A translator for the guide in the given language. Anything missing falls back to Spanish, never to a blank. */
export function guideT(lang: GuideLang): TFn {
  if (lang === "es") return (key, vars) => translate("es", key, vars);
  return (key: MessageKey, vars) => {
    const raw = LABELS[lang][key as string];
    if (raw === undefined) return translate("es", key, vars);
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => (vars && name in vars ? String(vars[name]) : `{${name}}`));
  };
}

const GUIDE_KEYS = ["title", "welcome", "checkin", "checkout", "houseRules", "safety"] as const;
const ITEM_KEYS = ["title", "body"] as const;

/** Applies the host's translations for `lang` over the base text. Empty translations never blank out the base. */
export function localizeGuide(guide: PublicGuide, lang: GuideLang): PublicGuide {
  if (lang === "es") return guide;
  const own = guide.translations?.[lang as "en" | "pt"];
  const out: PublicGuide = { ...guide };
  for (const k of GUIDE_KEYS) {
    const v = own?.[k]?.trim();
    if (v) out[k] = v;
  }
  out.items = guide.items.map((it) => {
    const tr = it.translations?.[lang as "en" | "pt"];
    const next = { ...it };
    for (const k of ITEM_KEYS) {
      const v = tr?.[k]?.trim();
      if (v) next[k] = v;
    }
    return next;
  });
  return out;
}

export type { GuideTranslations };
