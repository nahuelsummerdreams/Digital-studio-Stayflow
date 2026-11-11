"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { EmptyState, Skeleton, activeTabClass, buttonClass, cardClass, errorClass, ghostButtonClass, idleTabClass, inputClass, labelClass } from "@stayflow/ui";
import { addJob } from "../data";
import { localToday } from "../dates";
import { DEFAULT_CLEANING, groupJobs, itemsToChecklist, linesToItems, validateJob } from "../logic";
import { JOB_KINDS, type Checklist, type Job, type JobKind, type OpsProperty, type Staff } from "../types";
import { JobCard } from "./JobCard";

interface Props {
  client: SupabaseClient;
  orgId: string;
  properties: OpsProperty[];
  jobs: Job[];
  staff: Staff[];
  checklists: Checklist[];
  loading: boolean;
  reload: () => Promise<void>;
  /** Focus the form ("Nuevo trabajo"). */
  focusNonce?: number;
}

type Filter = "open" | "done" | "all";
const KIND_KEY = { cleaning: "ops.kindCleaning", maintenance: "ops.kindMaintenance", checkin: "ops.kindCheckin", other: "ops.kindOther" } as const;

export function OpsJobs({ client, orgId, properties, jobs, staff, checklists, loading, reload, focusNonce }: Props) {
  const { t } = useI18n();
  const today = localToday();
  const [filter, setFilter] = useState<Filter>("open");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [kind, setKind] = useState<JobKind>("cleaning");
  const [title, setTitle] = useState("");
  const [dueOn, setDueOn] = useState(today);
  const [assigneeId, setAssigneeId] = useState("");
  const [lines, setLines] = useState(DEFAULT_CLEANING.join("\n"));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(30);

  useEffect(() => {
    if (focusNonce) document.getElementById("job-title")?.focus();
  }, [focusNonce]);

  const selected = propertyId || properties[0]?.id || "";
  const rows = useMemo(() => {
    const g = groupJobs(jobs.filter((j) => !propertyFilter || j.propertyId === propertyFilter), today);
    const open = [...g.overdue, ...g.today, ...g.tomorrow, ...g.week, ...g.later];
    return filter === "open" ? open : filter === "done" ? g.done : [...open, ...g.done];
  }, [jobs, filter, propertyFilter, today]);

  if (properties.length === 0) return <EmptyState icon="building" title={t("ops.needProperty")} body={t("ops.needPropertyBody")} />;

  // Picking a kind loads the matching checklist: the property's own, else the business default, else the standard cleaning one.
  function pickTemplate(nextKind: JobKind, forProperty: string) {
    if (nextKind === "other") return setLines("");
    const own = checklists.find((c) => c.kind === nextKind && c.propertyId === forProperty) ?? checklists.find((c) => c.kind === nextKind && c.propertyId === null);
    setLines(own ? own.items.join("\n") : nextKind === "cleaning" ? DEFAULT_CLEANING.join("\n") : "");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const problem = validateJob({ propertyId: selected, title, dueOn });
    if (problem) return setError(t(problem));
    setBusy(true);
    setError(null);
    try {
      await addJob(client, orgId, { propertyId: selected, kind, title, dueOn, assigneeId: assigneeId || null, checklist: itemsToChecklist(linesToItems(lines)), notes });
      setTitle("");
      setNotes("");
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  const propertyOf = (id: string) => properties.find((p) => p.id === id);

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <form onSubmit={submit} className={`${cardClass} space-y-4 lg:sticky lg:top-8`}>
        <h2 className="text-sm font-medium">{t("ops.newJob")}</h2>
        <label className={labelClass}>
          {t("ops.property")}
          <select className={inputClass} value={selected} onChange={(e) => { setPropertyId(e.target.value); pickTemplate(kind, e.target.value); }}>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("ops.kind")}
            <select className={inputClass} value={kind} onChange={(e) => { const k = e.target.value as JobKind; setKind(k); pickTemplate(k, selected); }}>
              {JOB_KINDS.map((k) => <option key={k} value={k}>{t(KIND_KEY[k])}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            {t("ops.dueOn")}
            <input className={inputClass} type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} required />
          </label>
        </div>
        <label className={labelClass}>
          {t("ops.what")}
          <input id="job-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder={t("ops.whatPh")} />
        </label>
        <label className={labelClass}>
          {t("ops.assignTo")}
          <select className={inputClass} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">{t("ops.unassigned")}</option>
            {staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          {t("ops.checklistLines")}
          <textarea className={`${inputClass} min-h-28`} rows={5} value={lines} onChange={(e) => setLines(e.target.value)} />
        </label>
        <label className={labelClass}>
          {t("ops.notes")}
          <textarea className={`${inputClass} min-h-14`} rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>{busy ? t("ops.saving") : t("ops.addJob")}</button>
      </form>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div role="group" aria-label={t("ops.jobs")} className="fx-card flex gap-1 rounded-xl p-1">
            {(["open", "done", "all"] as Filter[]).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => { setFilter(f); setVisible(30); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${filter === f ? activeTabClass : idleTabClass}`}>
                {t(`ops.filter_${f}`)}
              </button>
            ))}
          </div>
          <select aria-label={t("ops.property")} className={`${inputClass} !w-auto`} value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}>
            <option value="">{t("ops.allProperties")}</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {loading ? <Skeleton className="h-28 rounded-card" /> : rows.length === 0 ? (
          <p className={`${cardClass} text-sm text-muted`}>{t("ops.noneHere")}</p>
        ) : (
          <ul className="space-y-3">
            {rows.slice(0, visible).map((j) => <JobCard key={j.id} client={client} job={j} property={propertyOf(j.propertyId)} staff={staff} today={today} onChanged={reload} />)}
          </ul>
        )}
        {rows.length > visible && <button type="button" className={ghostButtonClass} onClick={() => setVisible((v) => v + 30)}>{t("ops.showMore")}</button>}
      </section>
    </div>
  );
}
