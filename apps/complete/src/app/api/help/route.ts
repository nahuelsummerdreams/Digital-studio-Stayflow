import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isLocale } from "@stayflow/i18n/core";
import { helpSystemPrompt } from "@stayflow/i18n/help";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const fail = (code: string, status: number) => NextResponse.json({ code }, { status });

const MAX_TURNS = 6;
const MAX_CHARS = 600;

/** GET /api/help: tells the app whether the AI part is switched on (the key lives only on the server). No secrets in the answer. */
export async function GET() {
  return NextResponse.json({ ai: Boolean(process.env.ANTHROPIC_API_KEY) });
}

/**
 * POST /api/help  { locale, messages: [{ role, content }] }  with  Authorization: Bearer <the user's session token>
 * Answers "how do I use the app" questions. The AI is given ONLY the help topics (no account data, no tools), so it cannot read or change anything.
 * Every question counts against the organization's daily cap; the AI key stays on the server.
 */
export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fail("not_configured", 503);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return fail("unauthorized", 401);

  let locale: unknown;
  let raw: unknown;
  try {
    const body = (await req.json()) as { locale?: unknown; messages?: unknown };
    locale = body.locale;
    raw = body.messages;
  } catch {
    return fail("bad_request", 400);
  }
  if (!isLocale(locale) || !Array.isArray(raw)) return fail("bad_request", 400);
  const messages = raw
    .filter((m): m is { role: "user" | "assistant"; content: string } => !!m && typeof m === "object" && ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") && typeof (m as { content?: unknown }).content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_TURNS);
  if (messages.length === 0 || messages[messages.length - 1]!.role !== "user") return fail("bad_request", 400);

  const db = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: user } = await db.auth.getUser(token);
  if (!user.user) return fail("unauthorized", 401);

  const { data: orgs } = await db.from("organizations").select("id").order("created_at", { ascending: true }).limit(1);
  const org = orgs?.[0] as { id: string } | undefined;
  if (!org) return fail("no_org", 403);

  const cap = Number(process.env.HELP_DAILY_CAP ?? 40);
  const used = await db.rpc("assistant_consume", { p_org: org.id, p_cap: cap });
  if (used.error) {
    if (used.error.message.includes("assistant_limit")) return fail("limit", 429);
    return fail(used.error.code === "42501" ? "forbidden" : "error", used.error.code === "42501" ? 403 : 500);
  }

  try {
    const base = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";
    const model = process.env.HELP_MODEL ?? process.env.ASSISTANT_MODEL ?? "claude-haiku-5-5";
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 500, system: helpSystemPrompt(locale), messages }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return fail("error", 502);
    const out = (await res.json()) as { content?: { type: string; text?: string }[] };
    const reply = (out.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
    if (!reply) return fail("error", 502);
    return NextResponse.json({ reply, remaining: used.data as number });
  } catch {
    return fail("error", 502);
  }
}
