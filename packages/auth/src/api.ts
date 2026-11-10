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

/** Starts the 14-day trial (RPC in 0006_start_trial.sql). False if a license row already existed. */
export async function startTrial(client: SupabaseClient, orgId: string, product: ProductKey): Promise<boolean> {
  const { data, error } = await client.rpc("start_trial", { p_org: orgId, p_product: product });
  if (error) throw error;
  return data === true;
}

export interface Organization {
  id: string;
  name: string;
  currency: string;
}

/** Organizations the signed-in user belongs to (RLS filters the rest). */
export async function fetchOrganizations(client: SupabaseClient): Promise<Organization[]> {
  const { data, error } = await client
    .from("organizations")
    .select("id, name, currency")
    .order("created_at", { ascending: true })
    .returns<Organization[]>();
  if (error) throw error;
  return data ?? [];
}

export interface Property {
  id: string;
  name: string;
  city: string | null;
}

export async function fetchProperties(client: SupabaseClient, orgId: string): Promise<Property[]> {
  const { data, error } = await client
    .from("properties")
    .select("id, name, city")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .returns<Property[]>();
  if (error) throw error;
  return data ?? [];
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
  const { error } = await client
    .from("properties")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", propertyId);
  if (error) throw error;
}

export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof e.message === "string") return e.message;
  return "Something went wrong. Please try again.";
}
