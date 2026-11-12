export const JOB_KINDS = ["cleaning", "maintenance", "checkin", "other"] as const;
export type JobKind = (typeof JOB_KINDS)[number];

export const JOB_STATUSES = ["pending", "in_progress", "done"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const CHECKLIST_KINDS = ["cleaning", "maintenance", "checkin"] as const;
export type ChecklistKind = (typeof CHECKLIST_KINDS)[number];

export interface ChecklistItem {
  text: string;
  done: boolean;
}

/** Dates are plain "YYYY-MM-DD" strings: no time zones involved. */
export interface Job {
  id: string;
  propertyId: string;
  kind: JobKind;
  title: string;
  dueOn: string;
  status: JobStatus;
  assigneeId: string | null;
  checklist: ChecklistItem[];
  notes: string;
  bookingId: string | null;
  recurringId: string | null;
  /** For a cleaning: the day the next guest arrives at that property. */
  nextCheckin: string | null;
  doneAt: string | null;
}

export interface NewJob {
  propertyId: string;
  kind: JobKind;
  title: string;
  dueOn: string;
  assigneeId: string | null;
  checklist: ChecklistItem[];
  notes: string;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  /** The key of their private page. */
  token: string;
  active: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  kind: ChecklistKind;
  /** null = default for every property. */
  propertyId: string | null;
  items: string[];
}

export interface Recurring {
  id: string;
  propertyId: string;
  title: string;
  everyDays: number;
  nextDue: string;
  checklist: ChecklistItem[];
  active: boolean;
}

export interface OpsProperty {
  id: string;
  name: string;
  city?: string | null;
  photoUrl?: string | null;
}

/** What the team's private page shows: one job, with the property named. */
export interface StaffJob {
  id: string;
  staffName: string;
  propertyName: string;
  kind: JobKind;
  title: string;
  dueOn: string;
  status: JobStatus;
  checklist: ChecklistItem[];
  notes: string;
  nextCheckin: string | null;
  /** Evidence photos already uploaded. */
  photos: number;
}
