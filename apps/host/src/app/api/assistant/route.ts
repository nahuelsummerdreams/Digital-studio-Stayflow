import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { runAssistant, type ChatMessage, type ModelCall, type Snapshot } from "@stayflow/module-host/src/assistant";
import { loadBookings, loadTasks } from "@stayflow/module-host/src/data";
import { localToday } from "@stayflow/module-host/src/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (code: string, status: number) => NextResponse.json({ code }, { status });

/**
 * POST /api/assistant  { messages: [{ role, content }] }  with  Authorization: Bearer <the host's session token>
 * The server queries Supabase AS THE HOST (their token), so the usual security rules decide what the assistant can see.
 * The AI key stays here, on the server. Every question counts against the organization's daily cap.
 */
export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fail("not_configured", 503);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return fail("unauthorized", 401);

  let messages: ChatMessage[];
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return fail("bad_request", 400);
  }
  if (messages.length === 0 || messages.length > 40) return fail("bad_request", 400);

  const db = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: user } = await db.auth.getUser(token);
  if (!user.user) return fail("unauthorized", 401);

  const { data: orgs } = await db.from("organizations").select("id, name, currency").order("created_at", { ascending: true }).limit(1);
  const org = orgs?.[0] as { id: string; name: string; currency: string } | undefined;
  if (!org) return fail("no_org", 403);

  const cap = Number(process.env.ASSISTANT_DAILY_CAP ?? 40);
  const used = await db.rpc("assistant_consume", { p_org: org.id, p_cap: cap });
  if (used.error) {
    if (used.error.message.includes("assistant_limit")) return fail("limit", 429);
    return fail(used.error.code === "42501" ? "forbidden" : "error", used.error.code === "42501" ? 403 : 500);
  }

  try {
    const [bookings, tasks, props] = await Promise.all([
      loadBookings(db, org.id),
      loadTasks(db, org.id),
      db.from("properties").select("id, name, city").eq("org_id", org.id).is("archived_at", null).order("created_at", { ascending: true }),
    ]);
    const snapshot: Snapshot = { today: localToday(), currency: org.currency, bookings, tasks, properties: (props.data ?? []) as Snapshot["properties"] };

    const base = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";
    const model = process.env.ASSISTANT_MODEL ?? "claude-haiku-5-5";
    const call: ModelCall = async (body) => {
      const res = await fetch(`${base}/v1/messages`, {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model, max_tokens: 1024, system: body.system, tools: body.tools, messages: body.messages }),
      });
      if (!res.ok) throw new Error(`model_${res.status}`);
      return (await res.json()) as Awaited<ReturnType<ModelCall>>;
    };
    const out = await runAssistant({ call, snapshot, orgName: org.name, messages });
    return NextResponse.json({ reply: out.reply, remaining: used.data as number });
  } catch {
    return fail("error", 502);
  }
}
