"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { EmptyState, Skeleton, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { addTask, removeTask, setTaskDone } from "../data";
import { localToday } from "../dates";
import { shortDate } from "../format";
import type { HostTask } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  properties: { id: string; name: string }[];
  tasks: HostTask[];
  loading: boolean;
  reload: () => Promise<void>;
}

const WHOLE = "__all__";

export function HostTasks({ client, orgId, properties, tasks, loading, reload }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [propertyId, setPropertyId] = useState(WHOLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Checkbox answers instantly; the server confirms right after.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const nameOf = (id: string | null) => (id === null ? t("host.taskWholeBusiness") : properties.find((p) => p.id === id)?.name ?? t("properties.archived"));
  const view = tasks.map((x) => ({ ...x, done: optimistic[x.id] ?? x.done }));
  const pending = view.filter((x) => !x.done);
  const done = view.filter((x) => x.done);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await addTask(client, { orgId, propertyId: propertyId === WHOLE ? null : propertyId, title, dueOn: due || null });
      setTitle("");
      setDue("");
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(task: HostTask) {
    setError(null);
    setOptimistic((o) => ({ ...o, [task.id]: !task.done }));
    try {
      await setTaskDone(client, task.id, !task.done);
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setOptimistic((o) => {
        const { [task.id]: _gone, ...rest } = o;
        return rest;
      });
    }
  }

  async function remove(task: HostTask) {
    try {
      await removeTask(client, task.id);
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  const row = (task: HostTask) => {
    const overdue = !task.done && task.dueOn !== null && task.dueOn < today;
    return (
      <li key={task.id} className="flex items-center gap-3 py-3">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => toggle(task)}
          aria-label={task.done ? t("host.markUndone", { title: task.title }) : t("host.markDone", { title: task.title })}
          className="h-5 w-5 shrink-0 cursor-pointer accent-[rgb(var(--accent))]"
        />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-medium ${task.done ? "text-muted line-through" : ""}`}>{task.title}</span>
          <span className="block truncate text-xs text-muted">
            {nameOf(task.propertyId)}
            {task.dueOn && (
              <>
                {" · "}
                <span className={overdue ? "font-medium text-danger" : ""}>
                  {overdue ? `${t("host.overdue")} · ` : ""}
                  {t("host.dueOn", { date: shortDate(task.dueOn, locale) })}
                </span>
              </>
            )}
          </span>
        </span>
        <button type="button" className={ghostButtonClass} onClick={() => remove(task)} aria-label={t("host.removeTaskLabel", { title: task.title })}>
          {t("host.removeTask")}
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <form onSubmit={submit} className={`${cardClass} space-y-4 lg:sticky lg:top-8`}>
        <h2 className="text-sm font-medium">{t("host.newTask")}</h2>
        <label className={labelClass}>
          {t("host.taskTitle")}
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
        </label>
        <label className={labelClass}>
          {t("host.taskProperty")}
          <select className={inputClass} value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value={WHOLE}>{t("host.taskWholeBusiness")}</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {t("host.taskDue")}
          <input className={inputClass} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>{t("host.addTask")}</button>
      </form>

      <div className="space-y-6">
        {loading ? (
          <Skeleton className="h-48 rounded-card" />
        ) : tasks.length === 0 ? (
          <EmptyState icon="tasks" title={t("host.noPending")} body={t("host.allDone")} />
        ) : (
          <>
            <section className={cardClass}>
              <h2 className="text-sm font-medium">{t("host.pending")} · {pending.length}</h2>
              {pending.length === 0 ? <p className="mt-3 text-sm text-muted">{t("host.noPending")}</p> : <ul className="mt-2 divide-y divide-line">{pending.map(row)}</ul>}
            </section>
            <section className={cardClass}>
              <h2 className="text-sm font-medium">{t("host.done")} · {done.length}</h2>
              {done.length === 0 ? <p className="mt-3 text-sm text-muted">{t("host.noDone")}</p> : <ul className="mt-2 divide-y divide-line">{done.map(row)}</ul>}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
