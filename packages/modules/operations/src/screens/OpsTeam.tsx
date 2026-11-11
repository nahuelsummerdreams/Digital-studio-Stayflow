"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { Avatar, EmptyState, Icon, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { addStaff, removeStaff, setStaffActive } from "../data";
import { localToday, shortDate } from "../dates";
import { staffLink, workload } from "../logic";
import type { Job, Staff } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  staff: Staff[];
  jobs: Job[];
  reload: () => Promise<void>;
}

const digits = (p: string) => p.replace(/\D/g, "");

/** The people who do the work. Each gets a private link (no password, no app): open it, see my jobs, tick, done. */
export function OpsTeam({ client, orgId, staff, jobs, reload }: Props) {
  const { t, locale } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const load = workload(jobs, staff, localToday());

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim() === "") return setError(t("ops.errName"));
    setBusy(true);
    setError(null);
    try {
      await addStaff(client, orgId, name, phone);
      setName("");
      setPhone("");
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function run(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  async function copy(link: string, id: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setError(t("errors.generic"));
    }
  }

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <form onSubmit={submit} className={`${cardClass} space-y-4 lg:sticky lg:top-8`}>
        <h2 className="text-sm font-medium">{t("ops.addPerson")}</h2>
        <label className={labelClass}>{t("ops.name")}<input className={inputClass} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Rosa" /></label>
        <label className={labelClass}>{t("ops.phone")}<input className={inputClass} value={phone} maxLength={40} onChange={(e) => setPhone(e.target.value)} placeholder="+54 9 11 …" /></label>
        <p className="text-xs text-muted">{t("ops.teamHint")}</p>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>{busy ? t("ops.saving") : t("ops.addPersonBtn")}</button>
      </form>

      <section>
        {staff.length === 0 ? <EmptyState icon="users" title={t("ops.noTeam")} body={t("ops.noTeamBody")} /> : (
          <ul className="space-y-3">
            {load.map(({ staff: s, open, next }) => {
              const link = staffLink(origin, s.token);
              const message = t("ops.shareText", { name: s.name, link });
              return (
                <li key={s.id} className={`${cardClass} ${s.active ? "" : "opacity-60"}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={s.name} className="h-10 w-10 text-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg">{s.name}{!s.active && <span className="ml-2 text-xs font-normal text-muted">({t("ops.inactive")})</span>}</p>
                      <p className="text-sm text-muted">{open === 0 ? t("ops.noOpenJobs") : t("ops.openJobs", { count: open, date: next ? shortDate(next, locale) : "" })}</p>
                    </div>
                    <button type="button" className={ghostButtonClass} onClick={() => run(() => setStaffActive(client, s.id, !s.active))}>{s.active ? t("ops.deactivate") : t("ops.activate")}</button>
                    <button type="button" className={ghostButtonClass} onClick={() => window.confirm(t("ops.deleteConfirm")) && run(() => removeStaff(client, s.id))}>{t("ops.delete")}</button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-bg/50 px-3 py-2 text-xs">{link}</code>
                    <button type="button" className={`${ghostButtonClass} gap-2`} onClick={() => copy(link, s.id)}><Icon name={copied === s.id ? "check" : "copy"} className="h-4 w-4" />{t("ops.copyLink")}</button>
                    {digits(s.phone).length >= 8 && <a className={ghostButtonClass} href={`https://wa.me/${digits(s.phone)}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">{t("ops.sendWhatsapp")}</a>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
