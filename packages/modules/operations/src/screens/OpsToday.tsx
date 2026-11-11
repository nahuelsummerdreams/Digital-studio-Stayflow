"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n } from "@stayflow/i18n";
import { EmptyState, Icon, Skeleton, buttonClass, cardClass } from "@stayflow/ui";
import { localToday } from "../dates";
import { groupJobs, summary } from "../logic";
import type { Job, OpsProperty, Staff } from "../types";
import { JobCard } from "./JobCard";

interface Props {
  client: SupabaseClient;
  properties: OpsProperty[];
  jobs: Job[];
  staff: Staff[];
  loading: boolean;
  userName: string;
  reload: () => Promise<void>;
  onNewJob: () => void;
}

/** The day, planned: what is late, what is for today (tight turnovers first), what comes next. */
export function OpsToday({ client, properties, jobs, staff, loading, userName, reload, onNewJob }: Props) {
  const { t } = useI18n();
  const today = localToday();
  if (loading) return <div className="space-y-4"><Skeleton className="h-28 rounded-card" /><Skeleton className="h-40 rounded-card" /></div>;
  if (properties.length === 0) return <EmptyState icon="building" title={t("ops.needProperty")} body={t("ops.needPropertyBody")} />;

  const g = groupJobs(jobs, today);
  const s = summary(jobs, today);
  const stats = [
    { label: t("ops.statLate"), value: s.overdue, tone: s.overdue > 0 ? "text-danger" : "" },
    { label: t("ops.statToday"), value: s.today, tone: "" },
    { label: t("ops.statTight"), value: s.tight, tone: s.tight > 0 ? "text-amber-300" : "" },
    { label: t("ops.statDone"), value: s.doneToday, tone: "text-success" },
  ];
  const sections: { key: string; title: string; list: Job[]; tone?: string }[] = [
    { key: "overdue", title: t("ops.secLate"), list: g.overdue, tone: "text-danger" },
    { key: "today", title: t("ops.secToday"), list: g.today },
    { key: "tomorrow", title: t("ops.secTomorrow"), list: g.tomorrow },
    { key: "week", title: t("ops.secWeek"), list: g.week },
  ];
  const propertyOf = (id: string) => properties.find((p) => p.id === id);
  const empty = sections.every((x) => x.list.length === 0);

  return (
    <div className="anim-stagger space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{t("ops.hello", { name: userName })}</h1>
          <p className="mt-1.5 text-sm text-muted">{s.today + s.overdue === 0 ? t("ops.allClear") : t("ops.summary", { today: s.today, late: s.overdue })}</p>
        </div>
        <button type="button" className={`${buttonClass} gap-2`} onClick={onNewJob}><Icon name="plus" className="h-4 w-4" />{t("ops.newJob")}</button>
      </header>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((x) => (
          <li key={x.label} className={`${cardClass} !p-4`}>
            <p className={`font-display text-3xl tabular-nums ${x.tone}`}>{x.value}</p>
            <p className="mt-1 text-xs text-muted">{x.label}</p>
          </li>
        ))}
      </ul>

      {empty && (
        <div className={`${cardClass} text-center`}>
          <p className="font-display text-xl">{jobs.length === 0 ? t("ops.noJobsTitle") : t("ops.nothingSoon")}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">{jobs.length === 0 ? t("ops.noJobsBody") : t("ops.nothingSoonBody")}</p>
        </div>
      )}

      {sections.filter((x) => x.list.length > 0).map((x) => (
        <section key={x.key} aria-label={x.title}>
          <h2 className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${x.tone ?? "text-muted"}`}>{x.title}<span className="rounded-md bg-line/70 px-1.5 py-0.5 text-[11px] tabular-nums text-muted">{x.list.length}</span></h2>
          <ul className="space-y-3">
            {x.list.map((j) => <JobCard key={j.id} client={client} job={j} property={propertyOf(j.propertyId)} staff={staff} today={today} onChanged={reload} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}
