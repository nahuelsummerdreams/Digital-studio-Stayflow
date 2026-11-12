import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { License, LicenseStatus, PlanKey, ProductKey } from "@stayflow/licensing";

/** One Stayflow account works across every app: same Supabase project, same session. */
export function createStayflowClient(url: string, anonKey: string): SupabaseClient {
  if (!url || !anonKey) throw new Error("Missing Supabase URL or anon key. See .env.example");
  return createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
}

interface LicenseRow {
  product: ProductKey;
  plan: PlanKey;
  status: LicenseStatus;
  current_period_end: string | null;
}

/** Reads the licenses of an organization. RLS guarantees only members can see them. */
export async function fetchLicenses(client: SupabaseClient, orgId: string): Promise<License[]> {
  const { data, error } = await client
    .from("licenses")
    .select("product, plan, status, current_period_end")
    .eq("org_id", orgId)
    .returns<LicenseRow[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({
    product: r.product,
    plan: r.plan,
    status: r.status,
    currentPeriodEnd: r.current_period_end ? new Date(r.current_period_end) : null,
  }));
}

/** Creates an organization owned by the signed-in user (RPC defined in 0001_core.sql). */
export async function createOrganization(client: SupabaseClient, name: string, currency = "USD"): Promise<string> {
  const { data, error } = await client.rpc("create_organization", { p_name: name, p_currency: currency });
  if (error) throw error;
  return data as string;
}

/** Unlocks the products of a license code for the organization (RPC in 0022_license_codes.sql). Throws code P0002 if the code is unknown or already used. */
export async function redeemLicenseCode(client: SupabaseClient, orgId: string, code: string): Promise<string[]> {
  const { data, error } = await client.rpc("redeem_license_code", { p_org: orgId, p_code: code });
  if (error) throw error;
  return (data ?? []) as string[];
}

export type LodgingType = "rental" | "hotel" | "cabins" | "hostel";
/** The four categories, in the order they are offered. */
export const LODGING_TYPES: readonly LodgingType[] = ["rental", "hotel", "cabins", "hostel"];

export interface Organization {
  id: string;
  name: string;
  currency: string;
  /** What this business reserves: whole properties (rental), rooms (hotel) or beds and rooms (hostel). */
  lodgingType: LodgingType;
}

interface OrganizationRow {
  id: string;
  name: string;
  currency: string;
  lodging_type: LodgingType;
}

/** Organizations the signed-in user belongs to (RLS filters the rest). */
export async function fetchOrganizations(client: SupabaseClient): Promise<Organization[]> {
  const { data, error } = await client
    .from("organizations")
    .select("id, name, currency, lodging_type")
    .order("created_at", { ascending: true })
    .returns<OrganizationRow[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, currency: r.currency, lodgingType: r.lodging_type ?? "rental" }));
}

/** The modules this organization has, by key (0027_org_modules.sql). They follow its category. */
export async function fetchOrgModules(client: SupabaseClient, orgId: string): Promise<string[]> {
  const { data, error } = await client.from("org_modules").select("module").eq("org_id", orgId).eq("enabled", true).returns<{ module: string }[]>();
  if (error) throw error;
  return (data ?? []).map((r) => r.module);
}

export interface LodgingChangePreview {
  current: LodgingType;
  target: LodgingType;
  allowed: boolean;
  /** Why it is not allowed: units that the new category cannot hold. */
  reason: "has_units" | "has_beds" | null;
  rooms: number;
  beds: number;
  /** Modules that turn on / turn off. Data is never touched. */
  enable: string[];
  disable: string[];
}

/** What changing the category would do, without doing it. */
export async function previewLodgingChange(client: SupabaseClient, orgId: string, type: LodgingType): Promise<LodgingChangePreview> {
  const { data, error } = await client.rpc("lodging_change_preview", { p_org: orgId, p_type: type });
  if (error) throw error;
  return data as LodgingChangePreview;
}

/** Changes the category. The database adapts the modules and keeps every booking, guest and payment. */
export async function setLodgingType(client: SupabaseClient, orgId: string, type: LodgingType): Promise<void> {
  const { error } = await client.from("organizations").update({ lodging_type: type }).eq("id", orgId);
  if (error) throw error;
}

export type UnitKind = "room" | "bed";

export interface Property {
  id: string;
  name: string;
  city: string | null;
  /** Storage path of the cover photo, or null. */
  photoPath: string | null;
  /** Ready-to-use public URL of the cover photo, or null. */
  photoUrl: string | null;
  /** Set for rooms and beds: the establishment (or room) they hang from. */
  parentId: string | null;
  unitKind: UnitKind | null;
  roomCategory: string | null;
  /** Suggested nightly rate in minor units, or null. */
  baseRate: number | null;
}

interface PropertyRow {
  id: string;
  name: string;
  city: string | null;
  photo_path: string | null;
  parent_id: string | null;
  unit_kind: UnitKind | null;
  room_category: string | null;
  base_rate_minor: number | string | null;
}

export const PHOTO_BUCKET = "property-photos";

export async function fetchProperties(client: SupabaseClient, orgId: string): Promise<Property[]> {
  const { data, error } = await client
    .from("properties")
    .select("id, name, city, photo_path, parent_id, unit_kind, room_category, base_rate_minor")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .returns<PropertyRow[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city,
    photoPath: r.photo_path,
    photoUrl: r.photo_path ? client.storage.from(PHOTO_BUCKET).getPublicUrl(r.photo_path).data.publicUrl : null,
    parentId: r.parent_id,
    unitKind: r.unit_kind,
    roomCategory: r.room_category,
    baseRate: r.base_rate_minor === null ? null : Number(r.base_rate_minor),
  }));
}

/**
 * What can actually be reserved, with a readable name ("Hotel Sol · Hab 101").
 * rental: top-level properties; hotel: rooms; hostel: beds, or a room that has no beds (private room).
 * Establishments that only hold units are left out, so every app keeps working with a flat list.
 */
export function reservableProperties(all: Property[], type: LodgingType): Property[] {
  if (type === "rental" || type === "cabins") return all.filter((p) => !p.parentId);
  const byId = new Map(all.map((p) => [p.id, p]));
  const hasBeds = new Set(all.filter((p) => p.unitKind === "bed" && p.parentId).map((p) => p.parentId as string));
  const label = (p: Property): string => {
    const parts = [p.name];
    let up = p.parentId ? byId.get(p.parentId) : undefined;
    while (up) {
      parts.unshift(up.name);
      up = up.parentId ? byId.get(up.parentId) : undefined;
    }
    return parts.join(" · ");
  };
  return all
    .filter((p) => (p.unitKind === "bed" ? true : p.unitKind === "room" ? !hasBeds.has(p.id) : false))
    .map((p) => ({ ...p, name: label(p), city: p.city ?? byId.get(p.parentId ?? "")?.city ?? null }));
}

/** Adds `count` rooms or beds named "<prefix> 1", "<prefix> 2"... under `parentId`. */
export async function createUnits(
  client: SupabaseClient,
  orgId: string,
  input: { parentId: string; kind: UnitKind; prefix: string; count: number; startAt?: number; category?: string; baseRate?: number },
): Promise<string[]> {
  const count = Math.floor(input.count);
  if (!Number.isFinite(count) || count < 1 || count > 200) throw new Error("units-count");
  const start = Math.max(1, Math.floor(input.startAt ?? 1));
  const rows = Array.from({ length: count }, (_, i) => ({
    org_id: orgId,
    parent_id: input.parentId,
    unit_kind: input.kind,
    name: `${input.prefix.trim()} ${start + i}`.trim().slice(0, 120),
    room_category: input.category?.trim() || null,
    base_rate_minor: input.baseRate && input.baseRate > 0 ? Math.round(input.baseRate) : null,
  }));
  const { data, error } = await client.from("properties").insert(rows).select("id").returns<{ id: string }[]>();
  if (error) throw error;
  return (data ?? []).map((r) => r.id);
}

/** "80", "80,50" or "1.200,50" to integer minor units; null when it is not an amount. */
export function toMinor(raw: string): number | null {
  const s = raw.trim().replace(/[^\d.,]/g, "");
  if (s === "") return null;
  const dec = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  const tail = dec >= 0 ? s.length - dec - 1 : 0;
  const hasDecimals = tail > 0 && tail <= 2;
  const intPart = (hasDecimals ? s.slice(0, dec) : s).replace(/[.,]/g, "");
  const frac = hasDecimals ? s.slice(dec + 1).padEnd(2, "0") : "00";
  const n = Number(`${intPart || "0"}.${frac}`);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** The single establishment of a hotel or hostel, created from the business name the first time it is needed, so people only think in rooms and beds. */
export async function ensureEstablishment(client: SupabaseClient, orgId: string, name: string, existing: { id: string } | undefined): Promise<string> {
  if (existing) return existing.id;
  const { data, error } = await client.from("properties").insert({ org_id: orgId, name: name.trim() || "Establecimiento" }).select("id").single<{ id: string }>();
  if (error) throw error;
  return data.id;
}

/** Shrinks a photo to at most 1600px on its long side as JPEG, so uploads are fast and storage stays small. */
async function shrinkImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (blob) return blob;
  } catch {
    // fall through: upload the original if the browser cannot decode it
  }
  return file;
}

/** Uploads a new cover photo for a property and removes the previous one. */
export async function setPropertyPhoto(
  client: SupabaseClient,
  orgId: string,
  property: { id: string; photoPath: string | null },
  file: File,
): Promise<void> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("photo-type");
  const blob = await shrinkImage(file);
  if (blob.size > 5 * 1024 * 1024) throw new Error("photo-size");
  const path = `${orgId}/${crypto.randomUUID()}.jpg`;
  const up = await client.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (up.error) throw up.error;
  const { error } = await client.from("properties").update({ photo_path: path }).eq("id", property.id);
  if (error) {
    await client.storage.from(PHOTO_BUCKET).remove([path]);
    throw error;
  }
  if (property.photoPath) await client.storage.from(PHOTO_BUCKET).remove([property.photoPath]);
}

export async function removePropertyPhoto(client: SupabaseClient, property: { id: string; photoPath: string | null }): Promise<void> {
  const { error } = await client.from("properties").update({ photo_path: null }).eq("id", property.id);
  if (error) throw error;
  if (property.photoPath) await client.storage.from(PHOTO_BUCKET).remove([property.photoPath]);
}

export async function createProperty(
  client: SupabaseClient,
  orgId: string,
  input: { name: string; city?: string },
): Promise<void> {
  const { error } = await client
    .from("properties")
    .insert({ org_id: orgId, name: input.name.trim(), city: input.city?.trim() || null });
  if (error) throw error;
}

/** Archiving keeps the financial history; the property just stops showing up. */
export async function archiveProperty(client: SupabaseClient, propertyId: string): Promise<void> {
  // An establishment takes its rooms (and their beds) with it, so nothing is left reservable under an archived hotel.
  const rooms = await client.from("properties").select("id").eq("parent_id", propertyId).returns<{ id: string }[]>();
  if (rooms.error) throw rooms.error;
  const roomIds = (rooms.data ?? []).map((r) => r.id);
  const beds = roomIds.length > 0 ? await client.from("properties").select("id").in("parent_id", roomIds).returns<{ id: string }[]>() : { data: [], error: null };
  if (beds.error) throw beds.error;
  const ids = [propertyId, ...roomIds, ...(beds.data ?? []).map((b) => b.id)];
  const { error } = await client.from("properties").update({ archived_at: new Date().toISOString() }).in("id", ids);
  if (error) throw error;
}

// ------------------------------------------------------------------ team (0032_team_audit_tasks_messages.sql)
export type OrgRole = "owner" | "admin" | "member" | "viewer";
export type InviteRole = Exclude<OrgRole, "owner">;

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: OrgRole;
  since: string;
}
export interface TeamInvite {
  id: string;
  email: string;
  role: InviteRole;
  token: string;
  expiresAt: string;
}
export interface AuditRow {
  id: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
  at: string;
}

/** The signed-in user's role in the organization. */
export async function fetchMyRole(client: SupabaseClient, orgId: string, userId: string): Promise<OrgRole | null> {
  const { data, error } = await client.from("memberships").select("role").eq("org_id", orgId).eq("user_id", userId).maybeSingle<{ role: OrgRole }>();
  if (error) throw error;
  return data?.role ?? null;
}

/** Members and open invitations. Owners and admins only. */
export async function teamOverview(client: SupabaseClient, orgId: string): Promise<{ members: TeamMember[]; invites: TeamInvite[] }> {
  const { data, error } = await client.rpc("team_overview", { p_org: orgId });
  if (error) throw error;
  const d = data as { members: { user_id: string; email: string; name: string; role: OrgRole; since: string }[]; invites: { id: string; email: string; role: InviteRole; token: string; expires_at: string }[] };
  return {
    members: d.members.map((m) => ({ userId: m.user_id, email: m.email, name: m.name, role: m.role, since: m.since })),
    invites: d.invites.map((i) => ({ id: i.id, email: i.email, role: i.role, token: i.token, expiresAt: i.expires_at })),
  };
}

/** Creates an invitation and returns its code. Nothing is emailed: the owner shares the link. */
export async function inviteTeamMember(client: SupabaseClient, orgId: string, email: string, role: InviteRole): Promise<string> {
  const { data, error } = await client.rpc("invite_team_member", { p_org: orgId, p_email: email, p_role: role });
  if (error) throw error;
  return data as string;
}

export async function revokeTeamInvite(client: SupabaseClient, inviteId: string): Promise<void> {
  const { error } = await client.rpc("revoke_team_invite", { p_invite: inviteId });
  if (error) throw error;
}

/** The invited person (signed in with the invited email) joins the business. Throws 22023 for a wrong, used or expired code. */
export async function acceptTeamInvite(client: SupabaseClient, code: string): Promise<void> {
  const { error } = await client.rpc("accept_team_invite", { p_token: code.trim() });
  if (error) throw error;
}

export async function setMemberRole(client: SupabaseClient, orgId: string, userId: string, role: InviteRole): Promise<void> {
  const { error } = await client.rpc("set_member_role", { p_org: orgId, p_user: userId, p_role: role });
  if (error) throw error;
}

export async function removeTeamMember(client: SupabaseClient, orgId: string, userId: string): Promise<void> {
  const { error } = await client.rpc("remove_team_member", { p_org: orgId, p_user: userId });
  if (error) throw error;
}

export async function auditOverview(client: SupabaseClient, orgId: string, limit = 60): Promise<AuditRow[]> {
  const { data, error } = await client.rpc("audit_overview", { p_org: orgId, p_limit: limit });
  if (error) throw error;
  return ((data ?? []) as { id: string; actor: string; action: string; target: string; detail: string; created_at: string }[]).map((r) => ({ id: r.id, actor: r.actor, action: r.action, target: r.target, detail: r.detail, at: r.created_at }));
}
