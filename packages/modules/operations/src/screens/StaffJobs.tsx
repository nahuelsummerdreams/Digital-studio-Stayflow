"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n } from "@stayflow/i18n";
import { BrandMark, Pill, ProgressBar, Skeleton, errorClass } from "@stayflow/ui";
import { fetchStaffJobs, fetchStaffName, updateStaffJob } from "../data";
import { daysBetween, localToday, longDate, shortDate } from "../dates";
import { nextStatus, progress, turnover } from "../logic";
import type { JobStatus, StaffJob } from "../types";

/** The team's page: open the link, see my jobs, tick the boxes, tap "Terminé". Built for a phone, no login. */
export function StaffJobs({ client, token }: { client: SupabaseClient; token: string }) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [jobs, setJobs] = useState<StaffJob[] | null>(null);
  const [who, setWho] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState(false);
  // Taps are sent one after another, in order: two fast taps must never overtake each other on the way to the server.
  const queue = useRef<Promise<void>>(Promise.resolve());

  const load = useCallback(async () => {
    try {
      const name = await fetchStaffName(client, token);
      if (!name) return setFailed(true);
      setWho(name);
      setJobs(await fetchStaffJobs(client, token));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [client, token]);
  useEffect(() => {
    void load();
  }, [load]);

  function save(job: StaffJob, status: JobStatus, checklist = job.checklist) {
    setError(false);
    setJobs((list) => (list ?? []).map((j) => (j.id === job.id ? { ...j, status, checklist } : j))); // instant on screen
    queue.current = queue.current
      .then(() => updateStaffJob(client, token, job.id, status, checklist.map((c) => c.done)))
      .catch(() => {
        setError(true);
        return load(); // the server is the truth: show what it really has
      });
  }

  if (failed) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <BrandMark className="mx-auto h-12 w-12" />
        <h1 className="font-display mt-6 text-2xl">{t("ops.staffInvalid")}</h1>
        <p className="mt-2 text-sm text-muted">{t("ops.staffInvalidBody")}</p>
      </main>
    );
  }
  if (jobs === null) return <main className="mx-auto max-w-lg space-y-4 px-5 py-10"><Skeleton className="h-10 w-48" /><Skeleton className="h-40 rounded-card" /></main>;

  const name = who ?? jobs[0]?.staffName;
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="flex items-center gap-3"><BrandMark className="h-10 w-10" /><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Stayflow Operations</p><h1 className="font-display text-2xl">{name ? t("ops.staffHello", { name }) : t("ops.staffTitle")}</h1></div></div>
      {error && <p role="alert" className={`${errorClass} mt-4`}>{t("ops.staffError")}</p>}
      {jobs.length === 0 ? (
        <p className="fx-card mt-8 rounded-2xl p-6 text-center text-sm text-muted">{t("ops.staffNone")}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {jobs.map((j) => {
            const p = progress(j);
            const tight = turnover(j);
            const late = j.dueOn < today && j.status !== "done";
            const next = nextStatus(j.status);
            return (
              <li key={j.id} className={`fx-card rounded-3xl p-5 ${j.status === "done" ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={late ? "danger" : j.dueOn === today ? "warning" : "muted"}>{late ? t("ops.lateDays", { count: daysBetween(j.dueOn, today) }) : j.dueOn === today ? t("ops.today") : longDate(j.dueOn, locale)}</Pill>
                  {tight && <Pill tone={tight.tight ? "warning" : "muted"}>{tight.days <= 0 ? t("ops.nextSameDay") : tight.days === 1 ? t("ops.nextTomorrow") : t("ops.nextOn", { date: shortDate(j.nextCheckin as string, locale) })}</Pill>}
                  {j.status === "done" && <Pill tone="success">{t("ops.statusDone")}</Pill>}
                </div>
                <h2 className="font-display mt-3 text-xl">{j.title}</h2>
                <p className="text-sm text-muted">{j.propertyName}</p>
                {j.notes && <p className="mt-3 rounded-xl border border-line bg-bg/50 p-3 text-sm">{j.notes}</p>}
                {j.checklist.length > 0 && (
                  <>
                    <div className="mt-4"><ProgressBar value={p.pct} label={t("ops.progress")} /></div>
                    <ul className="mt-3 space-y-1">
                      {j.checklist.map((it, i) => (
                        <li key={`${i}-${it.text}`}>
                          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2 text-base">
                            <input type="checkbox" className="h-6 w-6 shrink-0 accent-[rgb(var(--accent))]" checked={it.done} onChange={() => save(j, j.status === "pending" ? "in_progress" : j.status, j.checklist.map((c, k) => (k === i ? { ...c, done: !c.done } : c)))} />
                            <span className={it.done ? "text-muted line-through" : ""}>{it.text}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="mt-5 flex gap-2">
                  {next && <button type="button" onClick={() => save(j, next)} className="fx-btn flex-1 rounded-2xl px-5 py-4 text-base font-semibold text-onaccent">{next === "in_progress" ? t("ops.start") : t("ops.staffFinish")}</button>}
                  {j.status === "done" && <button type="button" onClick={() => save(j, "pending")} className="flex-1 rounded-2xl border border-line px-5 py-4 text-base font-semibold">{t("ops.reopen")}</button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
