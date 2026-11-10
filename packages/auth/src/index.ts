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
