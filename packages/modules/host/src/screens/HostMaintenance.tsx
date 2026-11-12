"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { formatMoney, parseMoney } from "@stayflow/money";
import { EmptyState, Skeleton, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { addIncident, incidentToExpense, loadIncidents, loadPeople, removeIncident, updateIncident, type Incident, type IncidentStatus, type Person } from "../data";
import { shortDate } from "../format";
import type { HostProperty } from "../types";
import { useUnit } from "../useHostData";

interface Props {
  client: SupabaseClient;
  orgId: string;
  currency: string;
  properties: HostProperty[];
}

const NEXT: Record<IncidentStatus, IncidentStatus | null> = { open: "in_progress", in_progress: "resolved", resolved: null };

/** Incidents per unit with their cost, who fixes them, and one tap to send the cost to Profit as a maintenance expense. */
export function HostMaintenance({ client, orgId, currency, properties }: Props) {
  const { t, locale } = useI18n();
  const unit = useUnit();
  const [items, setItems] = useState<Incident[] | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [priority, setPriority] = useState<0 | 1 | 2>(1);
  const [assignee, setAssignee] = useState("");
  const [cost, setCost] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(await loadIncidents(client, orgId));
    } catch (e) {
      setError(t(errorKey(e)));
      setItems([]);
    }
  }, [client, orgId, t]);

  useEffect(() => {
    void reload();
    loadPeople(client, orgId).then(setPeople).catch(() => setPeople([]));
  }, [client, orgId, reload]);

  if (properties.length === 0) return <EmptyState icon="building" title={unit.addFirst} body={t("host.needUnitBody", { many: unit.many })} />;
  const selected = propertyId || properties[0]?.id || "";
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? t("properties.archived");
  const personName = (id: string | null) => (id ? people.find((p) => p.userId === id)?.name ?? "" : "");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const minor = cost.trim() === "" ? 0 : parseMoney(cost);
    if (minor === null || minor < 0) return setError(t("hx.payErr"));
    setBusy(true);
    try {
      await addIncident(client, orgId, { propertyId: selected, title, detail, priority, assigneeId: assignee || null, cost: minor });
      setTitle("");
      setDetail("");
      setCost("");
      setAssignee("");
      setPriority(1);
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setInfo(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      setError(code === "42501" ? t("host.needProfit") : code === "22023" ? t("maint.noCost") : t(errorKey(err)));
    }
  }

  async function toProfit(i: Incident) {
    await run(async () => {
      const created = await incidentToExpense(client, i.id);
      setInfo(created ? t("maint.sent") : t("maint.alreadySent"));
    });
  }

  async function setCostFor(i: Incident) {
    const raw = window.prompt(t("maint.costPrompt"), i.cost ? String(i.cost / 100) : "");
    if (raw === null) return;
    const minor = raw.trim() === "" ? 0 : parseMoney(raw);
    if (minor === null || minor < 0) return setError(t("hx.payErr"));
    await run(() => updateIncident(client, i.id, { cost: minor }));
  }

  const open = (items ?? []).filter((i) => i.status !== "resolved").sort((a, b) => b.priority - a.priority);
  const resolved = (items ?? []).filter((i) => i.status === "resolved");
  const month = new Date().toISOString().slice(0, 7);
  const monthCost = resolved.filter((i) => (i.resolvedAt ?? "").startsWith(month)).reduce((s, i) => s + i.cost, 0);

  const row = (i: Incident) => (
    <li key={i.id} className="py-3">
      <div className="flex flex-wrap items-start gap-3">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {i.title}
            {i.priority === 2 && <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] text-danger">{t("host.prioHigh")}</span>}
            <span className="rounded-full bg-line px-2 py-0.5 text-[11px] text-muted">{t(`maint.st_${i.status}`)}</span>
          </span>
          <span className="block text-xs text-muted">
            {nameOf(i.propertyId)}{personName(i.assigneeId) ? ` · ${personName(i.assigneeId)}` : ""} · {shortDate(i.createdAt.slice(0, 10), locale)}
          </span>
          {i.detail && <span className="mt-1 block text-xs text-muted">{i.detail}</span>}
        </span>
        <span className="text-right text-sm font-medium tabular-nums">{i.cost > 0 ? formatMoney(i.cost, currency, locale) : "—"}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {NEXT[i.status] && <button type="button" className={`${buttonClass} !px-3 !py-1.5 text-xs`} onClick={() => run(() => updateIncident(client, i.id, { status: NEXT[i.status] as IncidentStatus }))}>{t(`maint.go_${NEXT[i.status] as "in_progress" | "resolved"}`)}</button>}
        {i.status === "resolved" && <button type="button" className={`${ghostButtonClass} !px-3 !py-1.5 text-xs`} onClick={() => run(() => updateIncident(client, i.id, { status: "open" }))}>{t("maint.reopen")}</button>}
        <button type="button" className={`${ghostButtonClass} !px-3 !py-1.5 text-xs`} onClick={() => setCostFor(i)}>{t("maint.setCost")}</button>
        {i.cost > 0 && <button type="button" className={`${ghostButtonClass} !px-3 !py-1.5 text-xs`} onClick={() => toProfit(i)}>{t("maint.toProfit")}</button>}
        <button type="button" className={`${ghostButtonClass} !px-3 !py-1.5 text-xs`} onClick={() => window.confirm(t("maint.deleteConfirm")) && run(() => removeIncident(client, i.id))}>{t("host.delete")}</button>
      </div>
    </li>
  );

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <form onSubmit={submit} className={`${cardClass} space-y-4 lg:sticky lg:top-8`}>
        <h2 className="text-sm font-medium">{t("maint.new")}</h2>
        <label className={labelClass}>{unit.label}
          <select className={inputClass} value={selected} onChange={(e) => setPropertyId(e.target.value)}>{properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </label>
        <label className={labelClass}>{t("maint.what")}<input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required /></label>
        <label className={labelClass}>{t("maint.detail")}<textarea className={`${inputClass} min-h-16`} rows={2} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={2000} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>{t("host.taskPriority")}
            <select className={inputClass} value={priority} onChange={(e) => setPriority(Number(e.target.value) as 0 | 1 | 2)}>
              <option value={2}>{t("host.prioHigh")}</option><option value={1}>{t("host.prioNormal")}</option><option value={0}>{t("host.prioLow")}</option>
            </select>
          </label>
          <label className={labelClass}>{t("host.taskAssignee")}
            <select className={inputClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">{t("host.taskUnassigned")}</option>{people.map((p) => <option key={p.userId} value={p.userId}>{p.name}</option>)}
            </select>
          </label>
        </div>
        <label className={labelClass}>{t("maint.cost", { currency })}<input className={inputClass} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0,00" /></label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>{t("maint.add")}</button>
      </form>

      <div className="space-y-6">
        {info && <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">{info}</p>}
        {items === null ? <Skeleton className="h-48 rounded-card" /> : (
          <>
            <section className={cardClass}>
              <h2 className="text-sm font-medium">{t("maint.open")} · {open.length}</h2>
              {open.length === 0 ? <p className="mt-3 text-sm text-muted">{t("maint.noneOpen")}</p> : <ul className="mt-2 divide-y divide-line">{open.map(row)}</ul>}
            </section>
            <section className={cardClass}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-medium">{t("maint.resolved")} · {resolved.length}</h2>
                <span className="text-xs text-muted">{t("maint.monthCost", { amount: formatMoney(monthCost, currency, locale) })}</span>
              </div>
              {resolved.length === 0 ? <p className="mt-3 text-sm text-muted">{t("maint.noneResolved")}</p> : <ul className="mt-2 divide-y divide-line">{resolved.slice(0, 40).map(row)}</ul>}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
