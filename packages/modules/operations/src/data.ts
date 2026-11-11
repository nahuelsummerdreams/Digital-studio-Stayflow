import type { SupabaseClient } from "@supabase/supabase-js";
import type { Checklist, ChecklistItem, ChecklistKind, Job, JobKind, JobStatus, NewJob, Recurring, Staff, StaffJob } from "./types";

// ---------------------------------------------------------------- jobs
interface JobDb {
  id: string;
  property_id: string;
  kind: JobKind;
  title: string;
  due_on: string;
  status: JobStatus;
  assignee_id: string | null;
  checklist: ChecklistItem[];
  notes: string;
  booking_id: string | null;
  recurring_id: string | null;
  next_checkin: string | null;
  done_at: string | null;
}
const JOB_COLUMNS = "id, property_id, kind, title, due_on, status, assignee_id, checklist, notes, booking_id, recurring_id, next_checkin, done_at";

const toJob = (r: JobDb): Job => ({
  id: r.id, propertyId: r.property_id, kind: r.kind, title: r.title, dueOn: r.due_on, status: r.status, assigneeId: r.assignee_id,
  checklist: Array.isArray(r.checklist) ? r.checklist : [], notes: r.notes, bookingId: r.booking_id, recurringId: r.recurring_id, nextCheckin: r.next_checkin, doneAt: r.done_at,
});

export async function loadJobs(client: SupabaseClient, orgId: string, since: string): Promise<Job[]> {
  const { data, error } = await client.from("ops_jobs").select(JOB_COLUMNS).eq("org_id", orgId).gte("due_on", since).order("due_on", { ascending: true }).limit(2000).returns<JobDb[]>();
  if (error) throw error;
  return (data ?? []).map(toJob);
}

export async function addJob(client: SupabaseClient, orgId: string, j: NewJob): Promise<void> {
  const { error } = await client.from("ops_jobs").insert({ org_id: orgId, property_id: j.propertyId, kind: j.kind, title: j.title.trim(), due_on: j.dueOn, assignee_id: j.assigneeId, checklist: j.checklist, notes: j.notes.trim() });
  if (error) throw error;
}

export async function setJobStatus(client: SupabaseClient, id: string, status: JobStatus): Promise<void> {
  const { error } = await client.from("ops_jobs").update({ status, done_at: status === "done" ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw error;
}

export async function setJobChecklist(client: SupabaseClient, id: string, checklist: ChecklistItem[]): Promise<void> {
  const { error } = await client.from("ops_jobs").update({ checklist }).eq("id", id);
  if (error) throw error;
}

export async function setJobAssignee(client: SupabaseClient, id: string, assigneeId: string | null): Promise<void> {
  const { error } = await client.from("ops_jobs").update({ assignee_id: assigneeId }).eq("id", id);
  if (error) throw error;
}

export async function setJobNotes(client: SupabaseClient, id: string, notes: string): Promise<void> {
  const { error } = await client.from("ops_jobs").update({ notes: notes.trim() }).eq("id", id);
  if (error) throw error;
}

export async function removeJob(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("ops_jobs").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------- team
interface StaffDb { id: string; name: string; phone: string; token: string; active: boolean }

export async function loadStaff(client: SupabaseClient, orgId: string): Promise<Staff[]> {
  const { data, error } = await client.from("ops_staff").select("id, name, phone, token, active").eq("org_id", orgId).order("created_at", { ascending: true }).returns<StaffDb[]>();
  if (error) throw error;
  return data ?? [];
}

export async function addStaff(client: SupabaseClient, orgId: string, name: string, phone: string): Promise<void> {
  const { error } = await client.from("ops_staff").insert({ org_id: orgId, name: name.trim(), phone: phone.trim() });
  if (error) throw error;
}

export async function setStaffActive(client: SupabaseClient, id: string, active: boolean): Promise<void> {
  const { error } = await client.from("ops_staff").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function removeStaff(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("ops_staff").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------- checklists
interface ChecklistDb { id: string; name: string; kind: ChecklistKind; property_id: string | null; items: string[] }

export async function loadChecklists(client: SupabaseClient, orgId: string): Promise<Checklist[]> {
  const { data, error } = await client.from("ops_checklists").select("id, name, kind, property_id, items").eq("org_id", orgId).order("created_at", { ascending: true }).returns<ChecklistDb[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, kind: r.kind, propertyId: r.property_id, items: Array.isArray(r.items) ? r.items : [] }));
}

export async function saveChecklist(client: SupabaseClient, orgId: string, c: { id?: string; name: string; kind: ChecklistKind; propertyId: string | null; items: string[] }): Promise<void> {
  const row = { org_id: orgId, name: c.name.trim(), kind: c.kind, property_id: c.propertyId, items: c.items };
  const { error } = c.id ? await client.from("ops_checklists").update(row).eq("id", c.id) : await client.from("ops_checklists").insert(row);
  if (error) throw error;
}

export async function removeChecklist(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("ops_checklists").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------- recurring maintenance
interface RecurringDb { id: string; property_id: string; title: string; every_days: number; next_due: string; checklist: ChecklistItem[]; active: boolean }

export async function loadRecurring(client: SupabaseClient, orgId: string): Promise<Recurring[]> {
  const { data, error } = await client.from("ops_recurring").select("id, property_id, title, every_days, next_due, checklist, active").eq("org_id", orgId).order("next_due", { ascending: true }).returns<RecurringDb[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, propertyId: r.property_id, title: r.title, everyDays: r.every_days, nextDue: r.next_due, checklist: Array.isArray(r.checklist) ? r.checklist : [], active: r.active }));
}

export async function addRecurring(client: SupabaseClient, orgId: string, r: { propertyId: string; title: string; everyDays: number; nextDue: string; checklist: ChecklistItem[] }): Promise<void> {
  const { error } = await client.from("ops_recurring").insert({ org_id: orgId, property_id: r.propertyId, title: r.title.trim(), every_days: r.everyDays, next_due: r.nextDue, checklist: r.checklist });
  if (error) throw error;
}

export async function setRecurringActive(client: SupabaseClient, id: string, active: boolean): Promise<void> {
  const { error } = await client.from("ops_recurring").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function removeRecurring(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("ops_recurring").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------- automation
/** Creates the cleaning job of each Host stay and the maintenance jobs that are due. Safe to run on every open. */
export async function syncOperations(client: SupabaseClient, orgId: string): Promise<void> {
  const a = await client.rpc("ops_sync_bookings", { p_org: orgId });
  if (a.error) throw a.error;
  const b = await client.rpc("ops_generate_recurring", { p_org: orgId });
  if (b.error) throw b.error;
}

// ---------------------------------------------------------------- the team's private page (no login)
interface StaffJobDb {
  id: string; staff_name: string; property_name: string; kind: JobKind; title: string; due_on: string; status: JobStatus; checklist: ChecklistItem[]; notes: string; next_checkin: string | null;
}

/** The person's name if the link is valid and active, otherwise null. */
export async function fetchStaffName(client: SupabaseClient, token: string): Promise<string | null> {
  const { data, error } = await client.rpc("ops_staff_info", { p_token: token });
  if (error) throw error;
  return ((data ?? []) as { staff_name: string }[])[0]?.staff_name ?? null;
}

export async function fetchStaffJobs(client: SupabaseClient, token: string): Promise<StaffJob[]> {
  const { data, error } = await client.rpc("ops_staff_jobs", { p_token: token });
  if (error) throw error;
  return ((data ?? []) as StaffJobDb[]).map((r) => ({
    id: r.id, staffName: r.staff_name, propertyName: r.property_name, kind: r.kind, title: r.title, dueOn: r.due_on, status: r.status,
    checklist: Array.isArray(r.checklist) ? r.checklist : [], notes: r.notes, nextCheckin: r.next_checkin,
  }));
}

export async function updateStaffJob(client: SupabaseClient, token: string, jobId: string, status: JobStatus, done: boolean[]): Promise<void> {
  const { error } = await client.rpc("ops_staff_update", { p_token: token, p_job: jobId, p_status: status, p_done: done });
  if (error) throw error;
}
