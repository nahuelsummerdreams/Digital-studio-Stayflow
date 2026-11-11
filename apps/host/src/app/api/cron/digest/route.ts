import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { loadBookings, loadTasks } from "@stayflow/module-host/src/data";
import { localToday } from "@stayflow/module-host/src/dates";
import { buildDigest } from "@stayflow/module-host/src/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/digest: the morning email ("tu día"). Vercel Cron calls it daily with `Authorization: Bearer $CRON_SECRET`.
 * Needs SUPABASE_SERVICE_ROLE_KEY (to read every organization), RESEND_API_KEY and DIGEST_FROM (a sender verified in Resend).
 * Without them it does nothing and says so. Only owners and admins of organizations with a live Host license get it.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resend = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM;
  if (!url || !service || !resend || !from) return NextResponse.json({ code: "not_configured" }, { status: 503 });

  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const today = localToday();
  const { data: licenses } = await db.from("licenses").select("org_id").eq("product", "host").in("status", ["trialing", "active"]);
  let sent = 0;
  let skipped = 0;
  for (const { org_id } of (licenses ?? []) as { org_id: string }[]) {
    try {
      const { data: org } = await db.from("organizations").select("name, currency").eq("id", org_id).single();
      const [bookings, tasks, props, members] = await Promise.all([
        loadBookings(db, org_id),
        loadTasks(db, org_id),
        db.from("properties").select("id, name").eq("org_id", org_id).is("archived_at", null),
        db.from("memberships").select("user_id").eq("org_id", org_id).in("role", ["owner", "admin"]),
      ]);
      const currency = (org?.currency as string) ?? "USD";
      const money = (minor: number) => new Intl.NumberFormat("es", { style: "currency", currency }).format(minor / 100);
      const digest = buildDigest({ orgName: (org?.name as string) ?? "tu alojamiento", bookings, tasks, properties: (props.data ?? []) as { id: string; name: string }[], today, money });
      if (digest.empty) {
        skipped++;
        continue;
      }
      for (const m of (members.data ?? []) as { user_id: string }[]) {
        const { data: u } = await db.auth.admin.getUserById(m.user_id);
        const to = u.user?.email;
        if (!to) continue;
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${resend}`, "content-type": "application/json" },
          body: JSON.stringify({ from, to, subject: digest.subject, text: digest.text, html: digest.html }),
        });
        if (res.ok) sent++;
      }
    } catch {
      skipped++;
    }
  }
  return NextResponse.json({ sent, skipped });
}
