import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, BookingSource, BookingStatus, HostTask, NewBooking } from "./types";

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
}

const COLUMNS = "id, property_id, guest_name, guest_email, guest_phone, guests_count, check_in, check_out, nights, source, status, amount_minor, notes";

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
});

export async function loadBookings(client: SupabaseClient, orgId: string): Promise<Booking[]> {
  const { data, error } = await client
    .from("bookings")
    .select(COLUMNS)
    .eq("org_id", orgId)
    .order("check_in", { ascending: false })
    .limit(2000)
    .returns<BookingDb[]>();
  if (error) throw error;
  return (data ?? []).map(toBooking);
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
}

export async function loadTasks(client: SupabaseClient, orgId: string): Promise<HostTask[]> {
  const { data, error } = await client
    .from("host_tasks")
    .select("id, property_id, title, due_on, done")
    .eq("org_id", orgId)
    .order("due_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .returns<TaskDb[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, propertyId: r.property_id, title: r.title, dueOn: r.due_on, done: r.done }));
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
