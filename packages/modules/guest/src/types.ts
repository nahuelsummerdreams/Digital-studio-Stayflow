export const ACCENTS = ["blue", "green", "coral"] as const;
export type Accent = (typeof ACCENTS)[number];

export const PLACE_CATEGORIES = ["restaurant", "activity", "transport", "shop", "other"] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export type ItemKind = "place" | "appliance" | "faq";

/** Extra languages the host can write by hand. Spanish (the base text) is always there. */
export const EXTRA_LANGS = ["en", "pt"] as const;
export type ExtraLang = (typeof EXTRA_LANGS)[number];
export type GuideTextKey = "title" | "welcome" | "checkin" | "checkout" | "houseRules" | "safety";
export type ItemTextKey = "title" | "body";
export type GuideTranslations = Partial<Record<ExtraLang, Partial<Record<GuideTextKey, string>>>>;
export type ItemTranslations = Partial<Record<ExtraLang, Partial<Record<ItemTextKey, string>>>>;

export interface GuideFields {
  title: string;
  welcome: string;
  accent: Accent;
  wifiName: string;
  wifiPassword: string;
  checkin: string;
  checkout: string;
  houseRules: string;
  safety: string;
  hostName: string;
  hostPhone: string;
}

export interface Guide extends GuideFields {
  id: string;
  propertyId: string;
  slug: string;
  published: boolean;
  translations: GuideTranslations;
}

export interface GuideItem {
  id: string;
  kind: ItemKind;
  category: string;
  title: string;
  body: string;
  url: string;
  translations?: ItemTranslations;
}

/** What a guest receives (shape returned by get_public_guide). */
export interface PublicGuide {
  title: string;
  welcome: string;
  accent: Accent;
  propertyName: string;
  city: string | null;
  wifiName: string;
  wifiPassword: string;
  checkin: string;
  checkout: string;
  houseRules: string;
  safety: string;
  hostName: string;
  hostPhone: string;
  translations?: GuideTranslations;
  items: Omit<GuideItem, "id">[];
}
