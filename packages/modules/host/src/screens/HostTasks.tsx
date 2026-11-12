"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { EmptyState, Skeleton, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { addTask, loadPeople, removeTask, setTaskAssignee, setTaskDone, type Person } from "../data";
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
  /** The signed-in user, to offer "mine". */
  userId?: string;
}

const WHOLE = "__all__";

export function HostTasks({ client, orgId, properties, tasks, loading, reload, userId }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [propertyId, setPropertyId] = useState(WHOLE);
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<0 | 1 | 2>(1);
  const [mine, setMine] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  useEffect(() => {
    loadPeople(client, orgId).then(setPeople).catch(() => setPeople([]));
  }, [client, orgId]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Checkbox answers instantly; the server confirms right after.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const nameOf = (id: string | null) => (id === null ? t("host.taskWholeBusiness") : properties.find((p) => p.id === id)?.name ?? t("properties.archived"));
  const personName = (id: string | null) => (id ? people.find((p) => p.userId === id)?.name ?? "" : "");
  const view = tasks.filter((x) => !mine || x.assigneeId === userId).map((x) => ({ ...x, done: optimistic[x.id] ?? x.done }));
  const pending = view.filter((x) => !x.done).sort((a, b) => b.priority - a.priority);
  const done = view.filter((x) => x.done);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await addTask(client, { orgId, propertyId: propertyId === WHOLE ? null : propertyId, title, dueOn: due || null, assigneeId: assignee || null, priority });
      setTitle("");
      setDue("");
      setAssignee("");
      setPriority(1);
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
            {task.priority === 2 && <span className="mr-1.5 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">{t("host.prioHigh")}</span>}
            {task.priority === 0 && <span className="mr-1.5 rounded-full bg-line px-2 py-0.5 text-[11px] text-muted">{t("host.prioLow")}</span>}
            {nameOf(task.propertyId)}
            {task.assigneeId && personName(task.assigneeId) ? ` · ${personName(task.assigneeId)}` : ""}
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
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("host.taskAssignee")}
            <select className={inputClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">{t("host.taskUnassigned")}</option>
              {people.map((p) => <option key={p.userId} value={p.userId}>{p.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            {t("host.taskPriority")}
            <select className={inputClass} value={priority} onChange={(e) => setPriority(Number(e.target.value) as 0 | 1 | 2)}>
              <option value={2}>{t("host.prioHigh")}</option>
              <option value={1}>{t("host.prioNormal")}</option>
              <option value={0}>{t("host.prioLow")}</option>
            </select>
          </label>
        </div>
        <label className={labelClass}>
          {t("host.taskDue")}
          <input className={inputClass} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>{t("host.addTask")}</button>
      </form>

      <div className="space-y-6">
        {userId && people.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
            {t("host.onlyMine")}
          </label>
        )}
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
