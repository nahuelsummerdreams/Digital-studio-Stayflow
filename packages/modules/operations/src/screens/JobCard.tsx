"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { Avatar, Icon, Pill, ProgressBar, PropertyPhoto, buttonClass, errorClass, ghostButtonClass, inputClass } from "@stayflow/ui";
import { removeJob, setJobAssignee, setJobChecklist, setJobNotes, setJobStatus } from "../data";
import { daysBetween, longDate, shortDate } from "../dates";
import { nextStatus, progress, toggleItem, turnover, urgency } from "../logic";
import type { Job, OpsProperty, Staff } from "../types";

interface Props {
  client: SupabaseClient;
  job: Job;
  property?: OpsProperty;
  staff: Staff[];
  today: string;
  onChanged: () => Promise<void>;
  /** Start with the checklist open (e.g. on the team page). */
  defaultOpen?: boolean;
}

const KIND_ICON = { cleaning: "sparkles", maintenance: "settings", checkin: "key", other: "list" } as const;

/** One piece of work: what, where, when, who, how far along. Open it to tick the checklist and move it forward. */
export function JobCard({ client, job, property, staff, today, onChanged, defaultOpen = false }: Props) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const [notes, setNotes] = useState(job.notes);
  // Ticks show instantly; the server catches up (and wins if it disagrees).
  const [list, setList] = useState(job.checklist);
  useEffect(() => setList(job.checklist), [job.checklist]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const p = progress({ checklist: list });
  const u = urgency(job, today);
  const tight = turnover(job);
  const assignee = staff.find((s) => s.id === job.assigneeId);
  const next = nextStatus(job.status);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onChanged();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  const dueLabel = u === "overdue" ? t("ops.lateDays", { count: daysBetween(job.dueOn, today) }) : u === "today" ? t("ops.today") : daysBetween(today, job.dueOn) === 1 ? t("ops.tomorrow") : longDate(job.dueOn, locale);
  const tightLabel = tight ? (tight.days <= 0 ? t("ops.nextSameDay") : tight.days === 1 ? t("ops.nextTomorrow") : t("ops.nextOn", { date: shortDate(job.nextCheckin as string, locale) })) : null;

  return (
    <li className={`fx-card rounded-2xl ${job.status === "done" ? "opacity-70" : ""} ${tight?.tight && job.status !== "done" ? "!border-amber-400/50" : ""}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
        <PropertyPhoto url={property?.photoUrl} name={property?.name ?? ""} className="hidden h-14 w-20 shrink-0 rounded-xl sm:block" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <Icon name={KIND_ICON[job.kind]} className="h-4 w-4 text-accent" />
            <span className={`font-display text-lg ${job.status === "done" ? "line-through" : ""}`}>{job.title}</span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{property?.name ?? "—"}</span>
            <Pill tone={u === "overdue" ? "danger" : u === "today" ? "warning" : "muted"}>{dueLabel}</Pill>
            {tightLabel && <Pill tone={tight?.tight ? "warning" : "muted"}>{tightLabel}</Pill>}
            {job.status === "in_progress" && <Pill tone="accent">{t("ops.statusInProgress")}</Pill>}
            {job.status === "done" && <Pill tone="success">{t("ops.statusDone")}</Pill>}
          </span>
          {p.total > 0 && <span className="mt-3 flex items-center gap-3"><span className="max-w-xs flex-1"><ProgressBar value={p.pct} label={t("ops.progress")} /></span><span className="text-xs tabular-nums text-muted">{p.done}/{p.total}</span></span>}
        </span>
        {assignee ? <span className="flex shrink-0 items-center gap-2"><Avatar name={assignee.name} className="h-8 w-8 text-xs" /><span className="hidden text-sm sm:inline">{assignee.name}</span></span> : <span className="hidden shrink-0 text-xs text-muted sm:inline">{t("ops.unassigned")}</span>}
        <Icon name="chevron" className={`h-4 w-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-line px-4 pb-5 pt-4 sm:px-5">
          {list.length > 0 && (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {list.map((it, i) => (
                <li key={`${i}-${it.text}`}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 text-sm transition hover:bg-bg/60">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" checked={it.done} onChange={() => { const next = toggleItem(list, i); setList(next); void run(() => setJobChecklist(client, job.id, next)); }} />
                    <span className={it.done ? "text-muted line-through" : ""}>{it.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <label className="block text-xs font-medium text-muted">
            {t("ops.notes")}
            <textarea className={`${inputClass} mt-1 min-h-16`} rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes.trim() !== job.notes && run(() => setJobNotes(client, job.id, notes))} />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {next && <button type="button" className={buttonClass} disabled={busy} onClick={() => run(() => setJobStatus(client, job.id, next))}>{next === "in_progress" ? t("ops.start") : t("ops.finish")}</button>}
            {job.status === "done" && <button type="button" className={ghostButtonClass} disabled={busy} onClick={() => run(() => setJobStatus(client, job.id, "pending"))}>{t("ops.reopen")}</button>}
            <select aria-label={t("ops.assignTo")} className={`${inputClass} !w-auto !py-2.5`} value={job.assigneeId ?? ""} onChange={(e) => run(() => setJobAssignee(client, job.id, e.target.value || null))}>
              <option value="">{t("ops.unassigned")}</option>
              {staff.filter((s) => s.active || s.id === job.assigneeId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="button" className={`${ghostButtonClass} ml-auto`} disabled={busy} onClick={() => window.confirm(t("ops.deleteConfirm")) && run(() => removeJob(client, job.id))}>{t("ops.delete")}</button>
          </div>
          {error && <p role="alert" className={errorClass}>{error}</p>}
        </div>
      )}
    </li>
  );
}
