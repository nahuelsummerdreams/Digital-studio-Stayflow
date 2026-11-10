export const ACCENTS = ["blue", "green", "coral"] as const;
export type Accent = (typeof ACCENTS)[number];

export const PLACE_CATEGORIES = ["restaurant", "activity", "transport", "shop", "other"] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export type ItemKind = "place" | "appliance" | "faq";

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
}

export interface GuideItem {
  id: string;
  kind: ItemKind;
  category: string;
  title: string;
  body: string;
  url: string;
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
  items: Omit<GuideItem, "id">[];
}
