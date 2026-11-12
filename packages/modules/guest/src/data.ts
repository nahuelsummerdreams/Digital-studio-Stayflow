import type { SupabaseClient } from "@supabase/supabase-js";
import type { Accent, Guide, GuideFields, GuideItem, GuideTranslations, ItemKind, ItemTranslations, PublicGuide } from "./types";

interface GuideDb {
  id: string;
  property_id: string;
  slug: string;
  published: boolean;
  accent: Accent;
  title: string;
  welcome: string;
  wifi_name: string;
  wifi_password: string;
  checkin: string;
  checkout: string;
  house_rules: string;
  safety: string;
  host_name: string;
  host_phone: string;
  translations: GuideTranslations | null;
}

const COLUMNS =
  "id, property_id, slug, published, accent, title, welcome, wifi_name, wifi_password, checkin, checkout, house_rules, safety, host_name, host_phone, translations";

const toGuide = (r: GuideDb): Guide => ({
  id: r.id,
  propertyId: r.property_id,
  slug: r.slug,
  published: r.published,
  accent: r.accent,
  title: r.title,
  welcome: r.welcome,
  wifiName: r.wifi_name,
  wifiPassword: r.wifi_password,
  checkin: r.checkin,
  checkout: r.checkout,
  houseRules: r.house_rules,
  safety: r.safety,
  hostName: r.host_name,
  hostPhone: r.host_phone,
  translations: r.translations ?? {},
});

export interface GuideSummary {
  guide: Guide;
  itemKinds: { kind: ItemKind }[];
}

/** Every guide of the organization with just enough item data to compute completeness. */
export async function loadGuideSummaries(client: SupabaseClient, orgId: string): Promise<GuideSummary[]> {
  const { data, error } = await client.from("guest_guides").select(COLUMNS).eq("org_id", orgId).returns<GuideDb[]>();
  if (error) throw error;
  const guides = (data ?? []).map(toGuide);
  if (guides.length === 0) return [];
  const { data: items, error: itemsError } = await client
    .from("guest_guide_items")
    .select("guide_id, kind")
    .in("guide_id", guides.map((g) => g.id))
    .returns<{ guide_id: string; kind: ItemKind }[]>();
  if (itemsError) throw itemsError;
  return guides.map((guide) => ({
    guide,
    itemKinds: (items ?? []).filter((i) => i.guide_id === guide.id).map((i) => ({ kind: i.kind })),
  }));
}

export async function loadGuideByProperty(
  client: SupabaseClient,
  propertyId: string,
): Promise<{ guide: Guide; items: GuideItem[] } | null> {
  const { data, error } = await client.from("guest_guides").select(COLUMNS).eq("property_id", propertyId).maybeSingle<GuideDb>();
  if (error) throw error;
  if (!data) return null;
  const guide = toGuide(data);
  return { guide, items: await loadItems(client, guide.id) };
}

export async function loadItems(client: SupabaseClient, guideId: string): Promise<GuideItem[]> {
  const { data, error } = await client
    .from("guest_guide_items")
    .select("id, kind, category, title, body, url, translations")
    .eq("guide_id", guideId)
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<GuideItem[]>();
  if (error) throw error;
  return data ?? [];
}

export async function createGuide(client: SupabaseClient, input: { orgId: string; propertyId: string; title: string }): Promise<void> {
  const { error } = await client.from("guest_guides").insert({ org_id: input.orgId, property_id: input.propertyId, title: input.title });
  if (error) throw error;
}

export async function saveGuide(client: SupabaseClient, id: string, f: GuideFields): Promise<void> {
  const { error } = await client
    .from("guest_guides")
    .update({
      title: f.title.trim(),
      welcome: f.welcome.trim(),
      accent: f.accent,
      wifi_name: f.wifiName.trim(),
      wifi_password: f.wifiPassword.trim(),
      checkin: f.checkin.trim(),
      checkout: f.checkout.trim(),
      house_rules: f.houseRules.trim(),
      safety: f.safety.trim(),
      host_name: f.hostName.trim(),
      host_phone: f.hostPhone.trim(),
    })
    .eq("id", id);
  if (error) throw error;
}

/** Saves the hand-written translations of the guide's main texts. */
export async function saveGuideTranslations(client: SupabaseClient, id: string, translations: GuideTranslations): Promise<void> {
  const { error } = await client.from("guest_guides").update({ translations }).eq("id", id);
  if (error) throw error;
}

export async function saveItemTranslations(client: SupabaseClient, id: string, translations: ItemTranslations): Promise<void> {
  const { error } = await client.from("guest_guide_items").update({ translations }).eq("id", id);
  if (error) throw error;
}

export async function setPublished(client: SupabaseClient, id: string, published: boolean): Promise<void> {
  const { error } = await client.from("guest_guides").update({ published }).eq("id", id);
  if (error) throw error;
}

/** Replaces the public link; the old one stops working immediately. */
export async function rotateSlug(client: SupabaseClient, id: string): Promise<string> {
  const { data, error } = await client.rpc("rotate_guide_slug", { p_guide: id });
  if (error) throw error;
  return data as string;
}

export async function addItem(
  client: SupabaseClient,
  input: { guideId: string; kind: ItemKind; category: string; title: string; body: string; url: string; sort: number },
): Promise<void> {
  const { error } = await client.from("guest_guide_items").insert({
    guide_id: input.guideId,
    kind: input.kind,
    category: input.category,
    title: input.title.trim(),
    body: input.body.trim(),
    url: input.url,
    sort: input.sort,
  });
  if (error) throw error;
}

export async function removeItem(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("guest_guide_items").delete().eq("id", id);
  if (error) throw error;
}

interface PublicDb {
  title: string;
  welcome: string;
  accent: Accent;
  property_name: string;
  city: string | null;
  wifi_name: string;
  wifi_password: string;
  checkin: string;
  checkout: string;
  house_rules: string;
  safety: string;
  host_name: string;
  host_phone: string;
  translations?: GuideTranslations;
  items: Omit<GuideItem, "id">[];
}

/** What a guest sees. Works without a session; returns null when the guide is not available. */
export async function fetchPublicGuide(client: SupabaseClient, slug: string): Promise<PublicGuide | null> {
  const { data, error } = await client.rpc("get_public_guide", { p_slug: slug });
  if (error) throw error;
  if (!data) return null;
  const r = data as PublicDb;
  return {
    title: r.title,
    welcome: r.welcome,
    accent: r.accent,
    propertyName: r.property_name,
    city: r.city,
    wifiName: r.wifi_name,
    wifiPassword: r.wifi_password,
    checkin: r.checkin,
    checkout: r.checkout,
    houseRules: r.house_rules,
    safety: r.safety,
    hostName: r.host_name,
    hostPhone: r.host_phone,
    translations: r.translations ?? {},
    items: r.items ?? [],
  };
}
