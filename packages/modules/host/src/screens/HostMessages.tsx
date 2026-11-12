"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { EmptyState, Icon, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { loadGuideSlugs, loadTemplates, resetTemplate, saveTemplate } from "../data";
import { isActive } from "../logic";
import { addDays, localToday } from "../dates";
import { shortDate, isLinkablePhone } from "../format";
import { DEFAULT_TEMPLATES, TEMPLATE_KINDS, TEMPLATE_VARS, mailtoUrl, renderTemplate, whatsappUrl, type TemplateKind } from "../templates";
import type { Booking, HostProperty } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  properties: HostProperty[];
  bookings: Booking[];
  /** Where Stayflow Guest lives, to build each property's public guide link. */
  guestBase?: string;
}

const KIND_KEY = { welcome: "hx.msgWelcome", arrival: "hx.msgArrival", reminder: "hx.msgReminder", thanks: "hx.msgThanks" } as const;

/** Messages ready to send: pick a stay and a template, and it comes out with the name, dates and guide link filled in. */
export function HostMessages({ client, orgId, properties, bookings, guestBase }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const [saved, setSaved] = useState<Partial<Record<string, string>>>({});
  const [slugs, setSlugs] = useState<Record<string, string>>({});
  const [kind, setKind] = useState<TemplateKind>("welcome");
  const [bookingId, setBookingId] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadTemplates(client, orgId).then(setSaved).catch(() => undefined);
    void loadGuideSlugs(client, orgId).then(setSlugs).catch(() => undefined);
  }, [client, orgId]);

  const options = useMemo(
    () => bookings.filter((b) => isActive(b) && b.checkOut >= addDays(today, -7)).sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
    [bookings, today],
  );
  const booking = options.find((b) => b.id === bookingId) ?? options.find((b) => b.checkOut >= today) ?? options[0];
  const body = saved[kind] ?? DEFAULT_TEMPLATES[kind];
  const property = booking ? properties.find((p) => p.id === booking.propertyId) : undefined;
  const slug = booking ? slugs[booking.propertyId] : undefined;
  const guideUrl = slug && guestBase ? `${guestBase.replace(/\/+$/, "")}/g/${slug}` : null;
  const text = booking ? renderTemplate(body, { booking, propertyName: property?.name ?? "", guideUrl, locale }) : "";

  if (options.length === 0) return <EmptyState icon="message" title={t("hx.msgTitle")} body={t("hx.msgNone")} />;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(t("errors.generic"));
    }
  }

  async function save() {
    setError(null);
    try {
      await saveTemplate(client, orgId, kind, draft);
      setSaved((s) => ({ ...s, [kind]: draft.trim() }));
      setEditing(false);
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  async function reset() {
    setError(null);
    try {
      await resetTemplate(client, orgId, kind);
      setSaved((s) => {
        const next = { ...s };
        delete next[kind];
        return next;
      });
      setEditing(false);
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  return (
    <section className="space-y-5">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl">{t("hx.msgTitle")}</h2>
        <p className="mt-1.5 text-sm text-muted">{t("hx.msgBody")}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr] lg:items-start">
        <div className={`${cardClass} space-y-4`}>
          <label className={labelClass}>
            {t("hx.msgBooking")}
            <select className={inputClass} value={booking?.id ?? ""} onChange={(e) => { setBookingId(e.target.value); setEditing(false); }}>
              {options.map((b) => (
                <option key={b.id} value={b.id}>{b.guestName} · {shortDate(b.checkIn, locale)} → {shortDate(b.checkOut, locale)}</option>
              ))}
            </select>
          </label>
          <div role="group" className="grid gap-1.5">
            {TEMPLATE_KINDS.map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setEditing(false); }} className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition ${kind === k ? "border-accent bg-accent/10 text-accent" : "border-line hover:border-accent/50"}`}>
                {t(KIND_KEY[k])}{saved[k] && <span className="ml-2 text-[10px] uppercase text-muted">✎</span>}
              </button>
            ))}
          </div>
        </div>

        <div className={`${cardClass} space-y-4`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{editing ? t("hx.msgEdit") : t("hx.msgPreview")}</p>
          {editing ? (
            <>
              <textarea className={`${inputClass} min-h-40`} value={draft} maxLength={3000} onChange={(e) => setDraft(e.target.value)} />
              <p className="text-xs text-muted">{t("hx.msgEditHint", { vars: TEMPLATE_VARS.map((v) => `{${v}}`).join(" ") })}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass} onClick={save} disabled={draft.trim() === ""}>{t("hx.msgSave")}</button>
                <button type="button" className={ghostButtonClass} onClick={() => setEditing(false)}>{t("host.cancel")}</button>
                {saved[kind] && <button type="button" className={ghostButtonClass} onClick={reset}>{t("hx.msgReset")}</button>}
              </div>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap rounded-2xl border border-line bg-bg/50 p-4 text-sm leading-relaxed">{text}</p>
              {kind === "arrival" && !guideUrl && <p className="text-xs text-amber-300">{t("hx.msgNoGuide")}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`${buttonClass} gap-2`} onClick={copy}><Icon name={copied ? "check" : "copy"} className="h-4 w-4" />{copied ? t("hx.msgCopied") : t("hx.msgCopy")}</button>
                {booking && isLinkablePhone(booking.guestPhone) ? (
                  <a className={ghostButtonClass} href={whatsappUrl(booking.guestPhone, text)} target="_blank" rel="noopener noreferrer">{t("hx.msgWhatsapp")}</a>
                ) : (
                  <span className="self-center text-xs text-muted">{t("hx.msgNoPhone")}</span>
                )}
                {booking?.guestEmail && <a className={ghostButtonClass} href={mailtoUrl(booking.guestEmail, property?.name ?? "", text)}>{t("hx.msgEmail")}</a>}
                <button type="button" className={`${ghostButtonClass} ml-auto`} onClick={() => { setDraft(body); setEditing(true); }}>{t("hx.msgEdit")}</button>
              </div>
            </>
          )}
          {error && <p role="alert" className={errorClass}>{error}</p>}
        </div>
      </div>
    </section>
  );
}
