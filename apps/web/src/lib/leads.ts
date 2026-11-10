/** Saves an email (and what was in the cart) so no interested visitor is lost while checkout is being connected. */
export type LeadSource = "checkout" | "plan-starter" | "plan-pro" | "plan-business";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const leadsConfigured = (): boolean => Boolean(URL_ && KEY);

export async function saveLead(email: string, source: LeadSource, items: unknown = null): Promise<boolean> {
  if (!leadsConfigured()) return false;
  try {
    const res = await fetch(`${URL_}/rest/v1/leads`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ email: email.trim(), source, items }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
