import { lookup } from "node:dns/promises";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { loadBookings } from "@stayflow/module-host/src/data";
import { localToday } from "@stayflow/module-host/src/dates";
import { isPrivateAddress, parseIcal, planSync, sourceFromUrl } from "@stayflow/module-host/src/ical";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (code: string, status: number) => NextResponse.json({ code }, { status });
const MAX_BYTES = 1_000_000;

/** Downloads a calendar, but only from public https hosts: the URL is typed by a user, so it must never reach our own network. */
async function download(raw: string): Promise<string> {
  let u = new URL(raw);
  for (let hop = 0; hop < 3; hop++) {
    if (u.protocol !== "https:" || u.port !== "") throw new Error("url");
    const addrs = await lookup(u.hostname, { all: true });
    if (addrs.length === 0 || addrs.some((a) => isPrivateAddress(a.address))) throw new Error("url");
    const res = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { accept: "text/calendar, text/plain, */*", "user-agent": "Stayflow-Host-Sync" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      u = new URL(res.headers.get("location") as string, u);
      continue;
    }
    if (!res.ok) throw new Error(`http ${res.status}`);
    const text = await res.text();
    if (text.length > MAX_BYTES) throw new Error("size");
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("format");
    return text;
  }
  throw new Error("redirects");
}

/**
 * POST /api/ical/sync  { propertyId? }  with  Authorization: Bearer <the host's session token>
 * Pulls the calendar of one property (or all with a link), then adds, moves or cancels ONLY the bookings that came from it.
 * It runs as the host, so the usual security rules apply.
 */
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return fail("unauthorized", 401);
  const db = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: user } = await db.auth.getUser(token);
  if (!user.user) return fail("unauthorized", 401);

  let only: string | null = null;
  try {
    const body = (await req.json()) as { propertyId?: string };
    only = typeof body.propertyId === "string" ? body.propertyId : null;
  } catch {
    only = null;
  }

  let q = db.from("properties").select("id, org_id, ical_url").not("ical_url", "is", null).is("archived_at", null);
  if (only) q = q.eq("id", only);
  const { data: props, error } = await q.limit(50);
  if (error) return fail("error", 500);

  const today = localToday();
  const results: { propertyId: string; ok: boolean; added: number; updated: number; canceled: number; skipped: number; error?: string }[] = [];
  for (const p of (props ?? []) as { id: string; org_id: string; ical_url: string }[]) {
    const r = { propertyId: p.id, ok: false, added: 0, updated: 0, canceled: 0, skipped: 0 } as (typeof results)[number];
    try {
      const events = parseIcal(await download(p.ical_url));
      const imported = (await loadBookings(db, p.org_id)).filter((b) => b.propertyId === p.id && b.externalUid);
      const blocks = await db.from("bookings").select("id, external_uid, check_in, check_out, status, guest_name").eq("property_id", p.id).eq("kind", "block").not("external_uid", "is", null);
      const asBlocks = (blocks.data ?? []).map((b) => ({ id: b.id, externalUid: b.external_uid, checkIn: b.check_in, checkOut: b.check_out, status: b.status, guestName: b.guest_name })) as never[];
      const plan = planSync([...imported, ...asBlocks], events, today, "Reserva importada");
      const source = sourceFromUrl(p.ical_url);
      for (const e of plan.insert) {
        const { error: err } = await db.from("bookings").insert({ org_id: p.org_id, property_id: p.id, guest_name: e.name, kind: e.kind, check_in: e.start, check_out: e.end, source, external_uid: e.uid });
        if (err) r.skipped++; // overlaps something you already have: left for you to decide
        else r.added++;
      }
      for (const e of plan.update) {
        const { error: err } = await db.from("bookings").update({ check_in: e.start, check_out: e.end, ...(e.reopen ? { status: "confirmed" } : {}) }).eq("id", e.id);
        if (err) r.skipped++;
        else r.updated++;
      }
      for (const e of plan.cancel) {
        const { error: err } = await db.from("bookings").update({ status: "canceled" }).eq("id", e.id);
        if (!err) r.canceled++;
      }
      r.ok = true;
      await db.from("properties").update({ ical_synced_at: new Date().toISOString(), ical_status: r.skipped > 0 ? `${r.skipped} se cruzan con reservas tuyas` : "ok" }).eq("id", p.id);
    } catch (err) {
      r.error = err instanceof Error ? err.message : "error";
      await db.from("properties").update({ ical_status: `No se pudo leer el calendario (${r.error})`.slice(0, 200) }).eq("id", p.id);
    }
    results.push(r);
  }
  return NextResponse.json({ results });
}
