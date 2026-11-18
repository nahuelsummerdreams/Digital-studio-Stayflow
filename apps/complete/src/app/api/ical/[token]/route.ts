import { createClient } from "@supabase/supabase-js";
import { buildIcal } from "@stayflow/module-host/src/ical";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /api/ical/<token>.ics: the calendar other platforms read. Dates only; the unguessable token is the key. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.replace(/\.ics$/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!UUID.test(token) || !url || !anon) return new Response("Not found", { status: 404 });
  const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("ical_feed", { p_token: token });
  if (error) return new Response("Error", { status: 502 });
  const rows = (data ?? []) as { uid: string; check_in: string; check_out: string; is_block: boolean }[];
  const body = buildIcal("Stayflow", rows.map((r) => ({ uid: r.uid, checkIn: r.check_in, checkOut: r.check_out, block: r.is_block })));
  return new Response(body, { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "public, max-age=300" } });
}
