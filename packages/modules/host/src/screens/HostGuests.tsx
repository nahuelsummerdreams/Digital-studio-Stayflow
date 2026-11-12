"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { EmptyState, Pill, Skeleton, buttonClass, cardClass, errorClass, ghostButtonClass, infoClass, inputClass, labelClass } from "@stayflow/ui";
import { addGuestEvent, loadGuestEvents, loadGuestProfiles, loadIncidentKeys, removeGuestEvent, saveGuestProfile } from "../data";
import { shortDate, isLinkablePhone, phoneDigits } from "../format";
import { GUEST_SEGMENTS, guestSegments, guestStays, guestsDirectory, parseTags, type GuestSegment } from "../logic";
import type { Booking, GuestEvent, GuestEventKind, GuestProfile, HostProperty } from "../types";

interface Props {
  client: SupabaseClient;
  orgId: string;
  bookings: Booking[];
  properties: HostProperty[];
  loading: boolean;
  currency: string;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";

const STATUS_KEY = { inquiry: "host.statusInquiry", pending: "host.statusPending", confirmed: "host.statusConfirmed", checked_in: "host.statusCheckedIn", checked_out: "host.statusCheckedOut", canceled: "host.statusCanceled" } as const;

/** The file of one guest: what we know about them, their stays and their timeline. */
function GuestFile({ client, orgId, guestKey, bookings, properties, currency, profile, onSaved, onIncidentsChanged }: {
  client: SupabaseClient; orgId: string; guestKey: string; bookings: Booking[]; properties: HostProperty[]; currency: string;
  profile: GuestProfile | undefined; onSaved: (p: GuestProfile) => void; onIncidentsChanged: () => void;
}) {
  const { t, locale } = useI18n();
  const [document, setDocument] = useState(profile?.document ?? "");
  const [preferences, setPreferences] = useState(profile?.preferences ?? "");
  const [notes, setNotes] = useState(profile?.notes ?? "");
  const [tags, setTags] = useState((profile?.tags ?? []).join(", "));
  const [vip, setVip] = useState(profile?.vip ?? false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<GuestEvent[] | null>(null);
  const [kind, setKind] = useState<GuestEventKind>("note");
  const [body, setBody] = useState("");
  const stays = useMemo(() => guestStays(bookings, guestKey), [bookings, guestKey]);
  const prop = (id: string) => properties.find((p) => p.id === id)?.name ?? "—";

  const reload = useCallback(async () => {
    try {
      setEvents(await loadGuestEvents(client, orgId, guestKey));
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }, [client, orgId, guestKey, t]);
  useEffect(() => {
    void reload();
  }, [reload]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const next: GuestProfile = { guestKey, document, preferences, notes, vip, tags: parseTags(tags) };
    try {
      await saveGuestProfile(client, orgId, next);
      onSaved({ ...next, document: document.trim(), preferences: preferences.trim(), notes: notes.trim() });
      setSaved(true);
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    if (body.trim() === "") return;
    setError(null);
    try {
      await addGuestEvent(client, orgId, guestKey, kind, body);
      setBody("");
      await reload();
      onIncidentsChanged();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  async function removeEvent(id: string) {
    if (!window.confirm(t("guestFile.removeConfirm"))) return;
    try {
      await removeGuestEvent(client, id);
      await reload();
      onIncidentsChanged();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  return (
    <div className="mt-4 grid gap-6 border-t border-line pt-5 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-3">
        <label className={labelClass}>{t("guestFile.document")}<input className={inputClass} value={document} maxLength={60} onChange={(e) => { setDocument(e.target.value); setSaved(false); }} /></label>
        <label className={labelClass}>{t("guestFile.preferences")}<textarea className={`${inputClass} min-h-16`} rows={2} maxLength={1000} placeholder={t("guestFile.preferencesPh")} value={preferences} onChange={(e) => { setPreferences(e.target.value); setSaved(false); }} /></label>
        <label className={labelClass}>{t("guestFile.notes")}<textarea className={`${inputClass} min-h-20`} rows={3} maxLength={2000} placeholder={t("guestFile.notesPh")} value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false); }} /></label>
        <label className={labelClass}>{t("guestFile.tags")}<input className={inputClass} value={tags} onChange={(e) => { setTags(e.target.value); setSaved(false); }} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--accent))]" checked={vip} onChange={(e) => { setVip(e.target.checked); setSaved(false); }} />{t("guestFile.vip")}</label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        {saved && <p role="status" className={infoClass}>{t("guestFile.saved")}</p>}
        <button className={buttonClass} disabled={busy}>{busy ? t("guestFile.saving") : t("guestFile.save")}</button>
      </form>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t("guestFile.stays")}</p>
          {stays.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("guestFile.noStays")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line text-sm">
              {stays.slice(0, 8).map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span>{shortDate(b.checkIn, locale, true)} → {shortDate(b.checkOut, locale, true)} · <span className="text-muted">{prop(b.propertyId)}</span></span>
                  <span className="text-xs text-muted">{t(STATUS_KEY[b.status])} · {formatMoney(b.amount, currency, locale)}{b.paid > 0 ? ` (${t("guestFile.paid")} ${formatMoney(b.paid, currency, locale)})` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t("guestFile.timeline")}</p>
          <form onSubmit={addEvent} className="mt-2 space-y-2">
            <div className="flex gap-2">
              <select className={`${inputClass} !w-auto !py-2.5`} value={kind} onChange={(e) => setKind(e.target.value as GuestEventKind)} aria-label={t("guestFile.timeline")}>
                <option value="note">{t("guestFile.kindNote")}</option>
                <option value="incident">{t("guestFile.kindIncident")}</option>
              </select>
              <input className={inputClass} value={body} maxLength={1000} placeholder={t("guestFile.eventPh")} onChange={(e) => setBody(e.target.value)} />
            </div>
            <button className={ghostButtonClass} disabled={body.trim() === ""}>{t("guestFile.addEvent")}</button>
          </form>
          {events === null ? <Skeleton className="mt-3 h-10" /> : events.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t("guestFile.noEvents")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {events.map((ev) => (
                <li key={ev.id} className="flex items-start justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <Pill tone={ev.kind === "incident" ? "danger" : "muted"}>{ev.kind === "incident" ? t("guestFile.kindIncident") : t("guestFile.kindNote")}</Pill>
                    <span className="ml-2 text-xs text-muted">{shortDate(ev.createdAt.slice(0, 10), locale, true)}</span>
                    <span className="mt-1 block whitespace-pre-line break-words">{ev.body}</span>
                  </span>
                  <button type="button" className="shrink-0 text-xs text-muted underline-offset-4 hover:underline" onClick={() => void removeEvent(ev.id)}>{t("guestFile.remove")}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function HostGuests({ client, orgId, bookings, properties, loading, currency }: Props) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GuestSegment | "all">("all");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Map<string, GuestProfile>>(new Map());
  const [incidentKeys, setIncidentKeys] = useState<Set<string>>(new Set());
  const guests = useMemo(() => guestsDirectory(bookings), [bookings]);

  const loadExtras = useCallback(async () => {
    try {
      const [p, inc] = await Promise.all([loadGuestProfiles(client, orgId), loadIncidentKeys(client, orgId)]);
      setProfiles(new Map(p.map((x) => [x.guestKey, x])));
      setIncidentKeys(new Set(inc));
    } catch {
      /* the directory still works without the files */
    }
  }, [client, orgId]);
  useEffect(() => {
    if (orgId) void loadExtras();
  }, [orgId, loadExtras]);

  const segs = useMemo(() => new Map(guests.map((g) => [g.key, guestSegments(g, bookings, profiles.get(g.key), incidentKeys)])), [guests, bookings, profiles, incidentKeys]);
  const q = query.trim().toLowerCase();
  // the open file stays on screen even if saving it moves the guest out of the current filter
  const shown = guests.filter((g) => g.key === openKey || ((filter === "all" || (segs.get(g.key) ?? []).includes(filter)) && (!q || `${g.name} ${g.email} ${g.phone}`.toLowerCase().includes(q))));
  const count = (s: GuestSegment) => guests.filter((g) => (segs.get(g.key) ?? []).includes(s)).length;

  if (loading) return <Skeleton className="h-64 rounded-card" />;
  if (guests.length === 0) return <EmptyState icon="users" title={t("host.guestsEmptyTitle")} body={t("host.guestsEmptyBody")} />;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input className={`${inputClass} !mt-0 max-w-sm`} type="search" placeholder={t("host.searchGuest")} aria-label={t("host.searchGuest")} value={query} onChange={(e) => setQuery(e.target.value)} />
        <div role="tablist" className="flex flex-wrap gap-1.5">
          {(["all", ...GUEST_SEGMENTS] as const).map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === f ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-fg"}`}>
              {f === "all" ? t("guestFile.all") : t(`guestFile.seg.${f}`)} <span className="opacity-70">· {f === "all" ? guests.length : count(f)}</span>
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className={`${cardClass} text-sm text-muted`}>{q ? t("host.noMatches") : t("guestFile.noMatch")}</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((g) => {
            const open = openKey === g.key;
            const tags = segs.get(g.key) ?? [];
            const profile = profiles.get(g.key);
            return (
              <li key={g.key} className={`${cardClass} !p-5 ${open ? "lg:col-span-2" : ""}`}>
                <div className="flex items-start gap-4">
                  <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">{initials(g.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 truncate font-medium">
                      {g.name}
                      {tags.map((s) => <Pill key={s} tone={s === "incident" ? "danger" : s === "owes" ? "warning" : s === "vip" ? "accent" : "muted"}>{t(`guestFile.tag.${s}`)}</Pill>)}
                      {(profile?.tags ?? []).map((x) => <Pill key={x} tone="muted">{x}</Pill>)}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {g.email && <a href={`mailto:${g.email}`} className="underline-offset-4 hover:underline">{g.email}</a>}
                      {g.email && g.phone && " · "}
                      {g.phone && (isLinkablePhone(g.phone) ? <a href={`https://wa.me/${phoneDigits(g.phone)}`} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{g.phone}</a> : g.phone)}
                    </p>
                    <p className="mt-2 text-sm">
                      {t("host.stays", { count: g.stays })} · {t("entries.nights", { count: g.nights })}
                      {g.spent > 0 && <> · <span className="text-muted">{t("host.spent")}</span> {formatMoney(g.spent, currency, locale)}</>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{t("host.lastStay", { date: shortDate(g.lastStay, locale, true) })}</p>
                  </div>
                  <button type="button" className={`${ghostButtonClass} shrink-0 !px-3 !py-1.5 !text-xs`} aria-expanded={open} onClick={() => setOpenKey(open ? null : g.key)}>{open ? t("guestFile.close") : t("guestFile.open")}</button>
                </div>
                {open && (
                  <>
                    <p className="mt-3 text-xs text-muted">{t("guestFile.contactHint")}</p>
                    <GuestFile
                      client={client}
                      orgId={orgId}
                      guestKey={g.key}
                      bookings={bookings}
                      properties={properties}
                      currency={currency}
                      profile={profile}
                      onSaved={(p) => setProfiles((m) => new Map(m).set(p.guestKey, p))}
                      onIncidentsChanged={() => void loadExtras()}
                    />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
