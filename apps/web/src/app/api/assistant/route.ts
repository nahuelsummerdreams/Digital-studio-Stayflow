import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { RateLimiter, TOOLS, actionsFromToolUses, buildSystemPrompt, sanitizeCart, sanitizeMessages } from "@/lib/assistant/core";

/**
 * Shop assistant endpoint. The AI key lives only here, on the server (ANTHROPIC_API_KEY).
 * Without a key the page still works: the assistant falls back to its guided, rule-based mode.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ASSISTANT_MODEL || "claude-haiku-5-5";
const limiter = new RateLimiter(
  Number(process.env.ASSISTANT_PER_10_MIN) || 20,
  10 * 60_000,
  Number(process.env.ASSISTANT_DAILY_LIMIT) || 400,
);
const enabled = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY) && process.env.ASSISTANT_ENABLED !== "false";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Lets the page know whether free-text chat is available. */
export function GET() {
  return json({ ai: enabled() });
}

export async function POST(req: Request) {
  if (!enabled()) return json({ error: "unavailable" }, 503);

  const raw = await req.text();
  if (raw.length > 12_000) return json({ error: "too_large" }, 413);
  let body: { messages?: unknown; cart?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const messages = sanitizeMessages(body.messages);
  if (!messages) return json({ error: "bad_request" }, 400);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const verdict = limiter.check(ip);
  if (verdict !== "ok") return json({ error: verdict === "slow" ? "slow_down" : "busy" }, 429);

  try {
    const client = new Anthropic({ maxRetries: 1, timeout: 25_000 });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: buildSystemPrompt(sanitizeCart(body.cart)),
      messages,
      tools: TOOLS,
      tool_choice: { type: "auto" },
      output_config: { effort: "low" },
    });

    if (res.stop_reason === "refusal") return json({ text: "Con eso no puedo ayudarte. Si quieres, te cuento qué hace cada app o te ayudo a elegir.", actions: [] });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    const uses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use").map((b) => ({ name: b.name, input: b.input }));
    const actions = actionsFromToolUses(uses);
    return json({ text: text || (actions.length > 0 ? "Te dejo esto listo para que lo confirmes." : "¿Me cuentas un poco más sobre lo que necesitas?"), actions });
  } catch (err) {
    // Never leak provider details to the browser; the page falls back to its guided mode.
    if (!(err instanceof Anthropic.APIError)) console.error("assistant: unexpected error");
    else console.error(`assistant: provider error ${err.status}`);
    return json({ error: "provider_error" }, 502);
  }
}
