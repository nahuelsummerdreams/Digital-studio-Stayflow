import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, BookingKind, BookingSource, BookingStatus, HostTask, NewBooking } from "./types";

interface BookingDb {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guests_count: number;
  check_in: string;
  check_out: string;
  nights: number;
  source: BookingSource;
  status: BookingStatus;
  amount_minor: number;
  notes: string;
  created_at: string;
  paid_minor: number;
  kind: BookingKind;
  external_uid: string | null;
}

const COLUMNS = "id, property_id, guest_name, guest_email, guest_phone, guests_count, check_in, check_out, nights, source, status, amount_minor, notes, created_at, paid_minor, kind, external_uid";

const toBooking = (r: BookingDb): Booking => ({
  id: r.id,
  propertyId: r.property_id,
  guestName: r.guest_name,
  guestEmail: r.guest_email,
  guestPhone: r.guest_phone,
  guestsCount: r.guests_count,
  checkIn: r.check_in,
  checkOut: r.check_out,
  nights: r.nights,
  source: r.source,
  status: r.status,
  amount: Number(r.amount_minor),
  notes: r.notes,
  createdAt: r.created_at,
  paid: Number(r.paid_minor),
  kind: r.kind,
  externalUid: r.external_uid,
});

async function loadByKind(client: SupabaseClient, orgId: string, kind: BookingKind): Promise<Booking[]> {
  const { data, error } = await client
    .from("bookings")
    .select(COLUMNS)
    .eq("org_id", orgId)
    .eq("kind", kind)
    .order("check_in", { ascending: false })
    .limit(2000)
    .returns<BookingDb[]>();
  if (error) throw error;
  return (data ?? []).map(toBooking);
}

/** Guest stays only. Blocked dates are loaded apart so the numbers (occupancy, income, guests) never count them. */
export const loadBookings = (client: SupabaseClient, orgId: string) => loadByKind(client, orgId, "stay");
export const loadBlocks = (client: SupabaseClient, orgId: string) => loadByKind(client, orgId, "block");

/** Holds dates for maintenance or own use. The database refuses it if it overlaps a stay. */
export async function addBlock(client: SupabaseClient, orgId: string, b: { propertyId: string; reason: string; checkIn: string; checkOut: string }): Promise<void> {
  const { error } = await client.from("bookings").insert({
    org_id: orgId,
    property_id: b.propertyId,
    guest_name: b.reason.trim() || "Bloqueado",
    kind: "block",
    check_in: b.checkIn,
    check_out: b.checkOut,
  });
  if (error) throw error;
}

export async function setBookingPaid(client: SupabaseClient, id: string, paid: number): Promise<void> {
  const { error } = await client.from("bookings").update({ paid_minor: paid }).eq("id", id);
  if (error) throw error;
}

export async function addBooking(client: SupabaseClient, orgId: string, b: NewBooking): Promise<void> {
  const { error } = await client.from("bookings").insert({
    org_id: orgId,
    property_id: b.propertyId,
    guest_name: b.guestName.trim(),
    guest_email: b.guestEmail.trim(),
    guest_phone: b.guestPhone.trim(),
    guests_count: b.guestsCount,
    check_in: b.checkIn,
    check_out: b.checkOut,
    source: b.source,
    amount_minor: b.amount,
    paid_minor: b.paid ?? 0,
    notes: b.notes.trim(),
  });
  if (error) throw error;
}

export async function setBookingStatus(client: SupabaseClient, id: string, status: BookingStatus): Promise<void> {
  const { error } = await client.from("bookings").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function removeBooking(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("bookings").delete().eq("id", id);
  if (error) throw error;
}

/** Records the booking as income in Profit, once. Returns false if it was already recorded. */
export async function recordBookingIncome(client: SupabaseClient, bookingId: string): Promise<boolean> {
  const { data, error } = await client.rpc("record_booking_income", { p_booking: bookingId });
  if (error) throw error;
  return data !== null;
}

interface TaskDb {
  id: string;
  property_id: string | null;
  title: string;
  due_on: string | null;
  done: boolean;
  booking_id: string | null;
}

export async function loadTasks(client: SupabaseClient, orgId: string): Promise<HostTask[]> {
  const { data, error } = await client
    .from("host_tasks")
    .select("id, property_id, title, due_on, done, booking_id")
    .eq("org_id", orgId)
    .order("due_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .returns<TaskDb[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, propertyId: r.property_id, title: r.title, dueOn: r.due_on, done: r.done, bookingId: r.booking_id }));
}

export async function addTask(
  client: SupabaseClient,
  input: { orgId: string; propertyId: string | null; title: string; dueOn: string | null },
): Promise<void> {
  const { error } = await client
    .from("host_tasks")
    .insert({ org_id: input.orgId, property_id: input.propertyId, title: input.title.trim(), due_on: input.dueOn });
  if (error) throw error;
}

export async function setTaskDone(client: SupabaseClient, id: string, done: boolean): Promise<void> {
  const { error } = await client
    .from("host_tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function removeTask(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("host_tasks").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------- message templates
export async function loadTemplates(client: SupabaseClient, orgId: string): Promise<Partial<Record<string, string>>> {
  const { data, error } = await client.from("host_templates").select("kind, body").eq("org_id", orgId).returns<{ kind: string; body: string }[]>();
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.kind, r.body]));
}

export async function saveTemplate(client: SupabaseClient, orgId: string, kind: string, body: string): Promise<void> {
  const { error } = await client.from("host_templates").upsert({ org_id: orgId, kind, body: body.trim(), updated_at: new Date().toISOString() }, { onConflict: "org_id,kind" });
  if (error) throw error;
}

export async function resetTemplate(client: SupabaseClient, orgId: string, kind: string): Promise<void> {
  const { error } = await client.from("host_templates").delete().eq("org_id", orgId).eq("kind", kind);
  if (error) throw error;
}

/** Published Stayflow Guest guide of each property (slug), when the host also has Guest. Empty otherwise. */
export async function loadGuideSlugs(client: SupabaseClient, orgId: string): Promise<Record<string, string>> {
  const { data } = await client.from("guest_guides").select("property_id, slug").eq("org_id", orgId).eq("published", true).returns<{ property_id: string; slug: string }[]>();
  return Object.fromEntries((data ?? []).map((r) => [r.property_id, r.slug]));
}

// ---------------------------------------------------------------- calendar sync
export interface SyncProperty {
  id: string;
  name: string;
  icalUrl: string | null;
  icalToken: string;
  syncedAt: string | null;
  status: string | null;
}

export async function loadSyncProperties(client: SupabaseClient, orgId: string): Promise<SyncProperty[]> {
  const { data, error } = await client
    .from("properties")
    .select("id, name, ical_url, ical_token, ical_synced_at, ical_status")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .returns<{ id: string; name: string; ical_url: string | null; ical_token: string; ical_synced_at: string | null; ical_status: string | null }[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, icalUrl: r.ical_url, icalToken: r.ical_token, syncedAt: r.ical_synced_at, status: r.ical_status }));
}

export async function saveIcalUrl(client: SupabaseClient, propertyId: string, url: string): Promise<void> {
  const clean = url.trim();
  const { error } = await client.from("properties").update({ ical_url: clean === "" ? null : clean }).eq("id", propertyId);
  if (error) throw error;
}

export interface SyncResult {
  propertyId: string;
  ok: boolean;
  added: number;
  updated: number;
  canceled: number;
  skipped: number;
  error?: string;
}

/** Asks the Host server to pull the calendars (one property, or every one with a link). Runs as the signed-in host. */
export async function syncCalendars(client: SupabaseClient, propertyId?: string): Promise<SyncResult[]> {
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("unauthorized");
  const res = await fetch("/api/ical/sync", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ propertyId }) });
  if (!res.ok) throw new Error(`sync ${res.status}`);
  return ((await res.json()) as { results: SyncResult[] }).results;
}
