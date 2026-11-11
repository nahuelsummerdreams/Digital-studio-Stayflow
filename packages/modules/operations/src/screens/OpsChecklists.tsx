"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { EmptyState, Pill, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { removeChecklist, saveChecklist } from "../data";
import { DEFAULT_CLEANING, linesToItems } from "../logic";
import { CHECKLIST_KINDS, type Checklist, type ChecklistKind, type OpsProperty } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  properties: OpsProperty[];
  checklists: Checklist[];
  reload: () => Promise<void>;
}

const KIND_KEY = { cleaning: "ops.kindCleaning", maintenance: "ops.kindMaintenance", checkin: "ops.kindCheckin" } as const;

/** The lists your team follows. One per kind for the whole business, or one just for a property. */
export function OpsChecklists({ client, orgId, properties, checklists, reload }: Props) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ChecklistKind>("cleaning");
  const [propertyId, setPropertyId] = useState("");
  const [lines, setLines] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCleaningDefault = checklists.some((c) => c.kind === "cleaning" && c.propertyId === null);
  const reset = () => {
    setEditing(null);
    setName("");
    setLines("");
    setPropertyId("");
    setError(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const items = linesToItems(lines);
    if (name.trim() === "") return setError(t("ops.errName"));
    if (items.length === 0) return setError(t("ops.errItems"));
    setBusy(true);
    setError(null);
    try {
      await saveChecklist(client, orgId, { id: editing ?? undefined, name, kind, propertyId: propertyId || null, items });
      reset();
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  function edit(c: Checklist) {
    setEditing(c.id);
    setName(c.name);
    setKind(c.kind);
    setPropertyId(c.propertyId ?? "");
    setLines(c.items.join("\n"));
    setError(null);
  }

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <form onSubmit={submit} className={`${cardClass} space-y-4 lg:sticky lg:top-8`}>
        <h2 className="text-sm font-medium">{editing ? t("ops.editChecklist") : t("ops.newChecklist")}</h2>
        <label className={labelClass}>{t("ops.name")}<input className={inputClass} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={t("ops.namePh")} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("ops.kind")}
            <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as ChecklistKind)}>
              {CHECKLIST_KINDS.map((k) => <option key={k} value={k}>{t(KIND_KEY[k])}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            {t("ops.appliesTo")}
            <select className={inputClass} value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              <option value="">{t("ops.allProperties")}</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>
        <label className={labelClass}>{t("ops.checklistLines")}<textarea className={`${inputClass} min-h-40`} rows={7} value={lines} onChange={(e) => setLines(e.target.value)} /></label>
        <p className="text-xs text-muted">{t("ops.checklistHint")}</p>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <div className="flex gap-2">
          <button className={`${buttonClass} flex-1`} disabled={busy}>{busy ? t("ops.saving") : editing ? t("ops.saveChanges") : t("ops.saveChecklist")}</button>
          {editing && <button type="button" className={ghostButtonClass} onClick={reset}>{t("ops.cancel")}</button>}
        </div>
      </form>

      <section className="space-y-4">
        {!hasCleaningDefault && (
          <div className={`${cardClass} border-accent/30`}>
            <p className="font-display text-lg">{t("ops.standardTitle")}</p>
            <p className="mt-1 text-sm text-muted">{t("ops.standardBody")}</p>
            <ul className="mt-3 grid gap-1 text-sm text-muted sm:grid-cols-2">{DEFAULT_CLEANING.map((x) => <li key={x}>· {x}</li>)}</ul>
            <button type="button" className={`${ghostButtonClass} mt-4`} onClick={() => { reset(); setName(t("ops.standardName")); setKind("cleaning"); setLines(DEFAULT_CLEANING.join("\n")); document.getElementById("root")?.scrollIntoView(); }}>{t("ops.standardCopy")}</button>
          </div>
        )}
        {checklists.length === 0 ? (
          <EmptyState icon="list" title={t("ops.noChecklists")} body={t("ops.noChecklistsBody")} />
        ) : (
          <ul className="space-y-3">
            {checklists.map((c) => (
              <li key={c.id} className={cardClass}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg">{c.name}</span>
                  <Pill tone="accent">{t(KIND_KEY[c.kind])}</Pill>
                  <Pill tone="muted">{c.propertyId ? properties.find((p) => p.id === c.propertyId)?.name ?? "—" : t("ops.allProperties")}</Pill>
                  <span className="ml-auto text-xs text-muted">{t("ops.lines", { count: c.items.length })}</span>
                </div>
                <ul className="mt-3 grid gap-1 text-sm text-muted sm:grid-cols-2">{c.items.slice(0, 6).map((x, i) => <li key={`${i}-${x}`}>· {x}</li>)}{c.items.length > 6 && <li>…</li>}</ul>
                <div className="mt-4 flex gap-2">
                  <button type="button" className={ghostButtonClass} onClick={() => edit(c)}>{t("ops.edit")}</button>
                  <button type="button" className={ghostButtonClass} onClick={async () => { if (window.confirm(t("ops.deleteConfirm"))) { try { await removeChecklist(client, c.id); await reload(); } catch (err) { setError(t(errorKey(err))); } } }}>{t("ops.delete")}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
