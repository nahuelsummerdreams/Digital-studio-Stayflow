import { addDays, daysBetween } from "./dates";
import type { ChecklistItem, Job, JobStatus, Staff } from "./types";

export const isOpen = (j: Pick<Job, "status">): boolean => j.status !== "done";

export function progress(j: Pick<Job, "checklist">): { done: number; total: number; pct: number } {
  const total = j.checklist.length;
  const done = j.checklist.filter((i) => i.done).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export type Urgency = "overdue" | "today" | "soon" | "later";

export function urgency(j: Pick<Job, "dueOn" | "status">, today: string): Urgency {
  if (j.dueOn < today && isOpen(j)) return "overdue";
  if (j.dueOn === today) return "today";
  return daysBetween(today, j.dueOn) <= 7 ? "soon" : "later";
}

/**
 * How tight a cleaning is: the next guest arrives the same day the last one leaves ("same-day"),
 * the next day, or later. Null when nobody is booked after.
 */
export function turnover(j: Pick<Job, "kind" | "dueOn" | "nextCheckin">): { days: number; tight: boolean } | null {
  if (j.kind !== "cleaning" || !j.nextCheckin) return null;
  const days = daysBetween(j.dueOn, j.nextCheckin);
  return { days, tight: days <= 0 };
}

export interface JobGroups {
  overdue: Job[];
  today: Job[];
  tomorrow: Job[];
  week: Job[];
  later: Job[];
  done: Job[];
}

const byDueThenTight = (a: Job, b: Job) => a.dueOn.localeCompare(b.dueOn) || Number(turnover(b)?.tight ?? false) - Number(turnover(a)?.tight ?? false) || a.title.localeCompare(b.title);

/** Open jobs by when they are due, tight turnovers first within each day; finished ones apart, newest first. */
export function groupJobs(jobs: Job[], today: string): JobGroups {
  const g: JobGroups = { overdue: [], today: [], tomorrow: [], week: [], later: [], done: [] };
  const tomorrow = addDays(today, 1);
  for (const j of jobs) {
    if (!isOpen(j)) g.done.push(j);
    else if (j.dueOn < today) g.overdue.push(j);
    else if (j.dueOn === today) g.today.push(j);
    else if (j.dueOn === tomorrow) g.tomorrow.push(j);
    else if (daysBetween(today, j.dueOn) <= 7) g.week.push(j);
    else g.later.push(j);
  }
  for (const k of ["overdue", "today", "tomorrow", "week", "later"] as const) g[k].sort(byDueThenTight);
  g.done.sort((a, b) => (b.doneAt ?? b.dueOn).localeCompare(a.doneAt ?? a.dueOn));
  return g;
}

export function toggleItem(list: ChecklistItem[], index: number): ChecklistItem[] {
  return list.map((it, i) => (i === index ? { ...it, done: !it.done } : it));
}

/** Where a job can go next. Finishing is always one tap away. */
export function nextStatus(s: JobStatus): JobStatus | null {
  return s === "pending" ? "in_progress" : s === "in_progress" ? "done" : null;
}

/** One checklist line per row of text (blank lines dropped, 60 lines max, 160 characters each). */
export function linesToItems(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim().slice(0, 160)).filter(Boolean).slice(0, 60);
}

export const itemsToChecklist = (items: string[]): ChecklistItem[] => items.map((text) => ({ text, done: false }));
export const checklistToLines = (list: ChecklistItem[]): string => list.map((i) => i.text).join("\n");

/** The private page of a team member. Share it by WhatsApp: no password, no app to install. */
export const staffLink = (origin: string, token: string): string => `${origin.replace(/\/+$/, "")}/t/${token}`;

/** Open jobs per person (and unassigned) from `from` on. */
export function workload(jobs: Job[], staff: Staff[], from: string): { staff: Staff; open: number; next: string | null }[] {
  return staff.map((s) => {
    const mine = jobs.filter((j) => j.assigneeId === s.id && isOpen(j) && j.dueOn >= from).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
    return { staff: s, open: mine.length, next: mine[0]?.dueOn ?? null };
  });
}

export function summary(jobs: Job[], today: string): { overdue: number; today: number; doneToday: number; tight: number } {
  const open = jobs.filter(isOpen);
  return {
    overdue: open.filter((j) => j.dueOn < today).length,
    today: open.filter((j) => j.dueOn === today).length,
    doneToday: jobs.filter((j) => !isOpen(j) && j.doneAt?.slice(0, 10) === today).length,
    tight: open.filter((j) => j.dueOn >= today && j.dueOn <= addDays(today, 1) && turnover(j)?.tight).length,
  };
}

export type JobError = "ops.errTitle" | "ops.errDate" | "ops.errProperty";
export function validateJob(input: { propertyId: string; title: string; dueOn: string }): JobError | null {
  if (!input.propertyId) return "ops.errProperty";
  if (input.title.trim() === "") return "ops.errTitle";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueOn)) return "ops.errDate";
  return null;
}

/** The standard cleaning list used when a business has not written its own (same as the database default). */
export const DEFAULT_CLEANING = [
  "Ventilar y abrir ventanas",
  "Cambiar sábanas y toallas",
  "Limpiar baños",
  "Limpiar cocina y electrodomésticos",
  "Barrer y fregar pisos",
  "Vaciar la basura",
  "Reponer amenities y papel",
  "Revisar daños u objetos olvidados",
  "Dejar todo listo para el huésped",
] as const;
