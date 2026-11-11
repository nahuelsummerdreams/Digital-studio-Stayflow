"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useI18n } from "@stayflow/i18n";
import { formatMoney, formatMoneyExact, parseMoney } from "@stayflow/money";
import { EmptyState, PropertyPhoto, Skeleton, activeTabClass, buttonClass, cardClass, errorClass, ghostButtonClass, idleTabClass, infoClass, inputClass, labelClass } from "@stayflow/ui";
import { addBooking, recordBookingIncome, removeBooking, setBookingPaid, setBookingStatus, updateBooking } from "../data";
import { addDays, localToday } from "../dates";
import { STATUS_KEY, STATUS_TONE, shortDate } from "../format";
import { isActive, nextStatuses, owed, paymentState, validateBooking } from "../logic";
import { BOOKING_SOURCES, type Booking, type BookingSource, type BookingStatus, type HostProperty } from "../types";
import { useHostData } from "../useHostData";

interface Props {
  client: SupabaseClient;
  orgId: string;
  currency: string;
  properties: HostProperty[];
  /** Start from a day picked on the calendar, or just focus the form ("Nueva reserva"). */
  prefill?: { propertyId?: string; checkIn?: string; nonce: number };
  onGoProperties: () => void;
  /** Shared data from the parent, so tabs do not refetch. */
  data: ReturnType<typeof useHostData>;
}

type Filter = "upcoming" | "all" | "past" | "canceled";
const FILTERS: Filter[] = ["upcoming", "all", "past", "canceled"];
const FILTER_KEY = { upcoming: "host.filterUpcoming", all: "host.filterAll", past: "host.filterPast", canceled: "host.filterCanceled" } as const;

export function HostBookings({ client, orgId, currency, properties, prefill, onGoProperties, data }: Props) {
  const { t, locale } = useI18n();
  const today = localToday();
  const { bookings, loading, reload } = data;

  const [propertyId, setPropertyId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestsCount, setGuestsCount] = useState("2");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 3));
  const [source, setSource] = useState<BookingSource>("airbnb");
  const [amount, setAmount] = useState("");
  const [paidIn, setPaidIn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [payValue, setPayValue] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [visible, setVisible] = useState(20);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.propertyId) setPropertyId(prefill.propertyId);
    if (prefill.checkIn) {
      setCheckIn(prefill.checkIn);
      setCheckOut(addDays(prefill.checkIn, 3));
    }
    const el = document.getElementById("booking-guest");
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.focus({ preventScroll: true });
  }, [prefill?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = propertyId || properties[0]?.id || "";
  const nameOf = (id: string) => properties.find((p) => p.id === id)?.name ?? t("properties.archived");
  const photoOf = (id: string) => properties.find((p) => p.id === id)?.photoUrl ?? null;

  const rows = useMemo(() => {
    const list = bookings.filter((b) => {
      if (filter === "canceled") return b.status === "canceled";
      if (b.status === "canceled") return false;
      if (filter === "upcoming") return b.checkOut >= today;
      if (filter === "past") return b.checkOut < today;
      return true;
    });
    // Upcoming reads best soonest-first; history reads best newest-first.
    return list.sort((a, b) => (filter === "upcoming" ? a.checkIn.localeCompare(b.checkIn) : b.checkIn.localeCompare(a.checkIn)));
  }, [bookings, filter, today]);

  if (properties.length === 0) {
    return (
      <EmptyState icon="building" title={t("host.needProperty")} body={t("host.needPropertyBody")}>
        <button type="button" className={buttonClass} onClick={onGoProperties}>{t("host.goProperties")}</button>
      </EmptyState>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const minor = amount.trim() === "" ? 0 : parseMoney(amount);
    const input = {
      propertyId: selected,
      guestName,
      guestEmail,
      guestPhone,
      guestsCount: Math.max(1, Math.floor(Number(guestsCount) || 1)),
      checkIn,
      checkOut,
      source,
      amount: minor ?? -1,
      paid: paidIn.trim() === "" ? 0 : (parseMoney(paidIn) ?? -1),
      notes,
    };
    if ((input.paid ?? 0) < 0) {
      setError(t("hx.payErr"));
      return;
    }
    const problem = validateBooking(input, [...bookings, ...data.blocks].filter((x) => x.id !== editingId));
    if (problem) {
      setError(t(problem));
      return;
    }
    setBusy(true);
    try {
      if (editingId) await updateBooking(client, editingId, input);
      else await addBooking(client, orgId, input);
      setEditingId(null);
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setAmount("");
      setPaidIn("");
      setNotes("");
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(b: Booking, status: BookingStatus) {
    if (status === "canceled" && !window.confirm(t("host.cancelConfirm", { name: b.guestName }))) return;
    setError(null);
    setInfo(null);
    try {
      await setBookingStatus(client, b.id, status);
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  async function remove(b: Booking) {
    if (!window.confirm(t("host.deleteConfirm"))) return;
    setError(null);
    try {
      await removeBooking(client, b.id);
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  function startEdit(b: Booking) {
    setEditingId(b.id);
    setPropertyId(b.propertyId);
    setGuestName(b.guestName);
    setGuestEmail(b.guestEmail);
    setGuestPhone(b.guestPhone);
    setGuestsCount(String(b.guestsCount));
    setCheckIn(b.checkIn);
    setCheckOut(b.checkOut);
    setSource(b.source);
    setAmount(b.amount > 0 ? String(b.amount / 100).replace(".", ",") : "");
    setPaidIn(b.paid > 0 ? String(b.paid / 100).replace(".", ",") : "");
    setNotes(b.notes);
    setError(null);
    document.getElementById("booking-guest")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setAmount("");
    setPaidIn("");
    setNotes("");
  }

  async function savePaid(b: Booking, minor: number | null) {
    setError(null);
    if (minor === null || minor < 0) return setError(t("hx.payErr"));
    try {
      await setBookingPaid(client, b.id, minor);
      setPayFor(null);
      setPayValue("");
      await reload();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  async function toProfit(b: Booking) {
    setError(null);
    setInfo(null);
    try {
      const created = await recordBookingIncome(client, b.id);
      setInfo(created ? t("host.incomeDone") : t("host.incomeAlready"));
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      setError(code === "42501" ? t("host.needProfit") : code === "22023" ? t("host.noAmount") : t(errorKey(err)));
    }
  }

  const actionLabel = (s: BookingStatus) => (s === "checked_in" ? t("host.doCheckIn") : s === "checked_out" ? t("host.doCheckOut") : t("host.cancel"));

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <form onSubmit={submit} className={`${cardClass} space-y-4 lg:sticky lg:top-8`}>
        <h2 className="text-sm font-medium">{editingId ? t("hx.editBooking") : t("host.newBooking")}</h2>
        <label className={labelClass}>
          {t("host.property")}
          <select className={inputClass} value={selected} onChange={(e) => setPropertyId(e.target.value)}>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {t("host.guestName")}
          <input id="booking-guest" className={inputClass} value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={120} required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("host.checkIn")}
            <input className={inputClass} type="date" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1)); }} required />
          </label>
          <label className={labelClass}>
            {t("host.checkOut")}
            <input className={inputClass} type="date" value={checkOut} min={addDays(checkIn, 1)} onChange={(e) => setCheckOut(e.target.value)} required />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("host.source")}
            <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value as BookingSource)}>
              {BOOKING_SOURCES.map((s) => (
                <option key={s} value={s}>{t(`sources.${s}`)}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t("host.guestsCount")}
            <input className={inputClass} type="number" min={1} max={50} value={guestsCount} onChange={(e) => setGuestsCount(e.target.value)} />
          </label>
        </div>
        <label className={labelClass}>
          {t("host.amount", { currency })}
          <input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        </label>
        <label className={labelClass}>
          {t("hx.payPaidLabel", { currency })}
          <input className={inputClass} inputMode="decimal" value={paidIn} onChange={(e) => setPaidIn(e.target.value)} placeholder="0,00" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("host.guestEmail")}
            <input className={inputClass} type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} maxLength={200} />
          </label>
          <label className={labelClass}>
            {t("host.guestPhone")}
            <input className={inputClass} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} maxLength={40} placeholder="+34 600 123 456" />
          </label>
        </div>
        <label className={labelClass}>
          {t("host.notes")}
          <textarea className={`${inputClass} min-h-16`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>{busy ? t("host.adding") : editingId ? t("hx.saveChanges") : t("host.add")}</button>
        {editingId && <button type="button" className={`${ghostButtonClass} w-full`} onClick={cancelEdit}>{t("host.cancel")}</button>}
      </form>

      <section className="space-y-4">
        <div role="group" aria-label={t("host.listTitle")} className="flex gap-1 overflow-x-auto fx-card rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => { setFilter(f); setVisible(20); }}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${filter === f ? activeTabClass : idleTabClass}`}
            >
              {t(FILTER_KEY[f])}
            </button>
          ))}
        </div>

        {info && <p role="status" className={infoClass}>{info}</p>}

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState icon="bed" title={t("host.emptyTitle")} body={t("host.emptyBody")} />
        ) : rows.length === 0 ? (
          <p className={`${cardClass} text-sm text-muted`}>{t("host.emptyFilter")}</p>
        ) : (
          <ul className="space-y-3">
            {rows.slice(0, visible).map((b) => (
              <li key={b.id} className={`${cardClass} !p-4 sm:!p-5`}>
                <div className="flex gap-4">
                  <PropertyPhoto url={photoOf(b.propertyId)} name={nameOf(b.propertyId)} className="hidden h-28 w-40 rounded-xl sm:block" />
                  <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg">{b.guestName}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[b.status]}`}>{t(STATUS_KEY[b.status])}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {shortDate(b.checkIn, locale)} → {shortDate(b.checkOut, locale, true)} · {t("entries.nights", { count: b.nights })} · {t("host.people", { count: b.guestsCount })}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{nameOf(b.propertyId)} · {t(`sources.${b.source}`)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg">{b.amount > 0 ? formatMoney(b.amount, currency, locale) : "—"}</p>
                    {(() => {
                      const st = paymentState(b);
                      const label = st === "unpriced" ? t("hx.payUnpriced") : st === "unpaid" ? t("hx.payUnpaid") : st === "paid" ? t("hx.payPaid") : t("hx.payPartial", { paid: formatMoney(b.paid, currency, locale), owed: formatMoney(owed(b), currency, locale) });
                      const tone = st === "paid" ? "bg-success/15 text-success" : st === "unpriced" ? "bg-line text-muted" : "bg-amber-400/10 text-amber-300";
                      return <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
                    })()}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {nextStatuses(b.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={s === "canceled" ? ghostButtonClass : `${buttonClass} !px-3 !py-2`}
                      onClick={() => changeStatus(b, s)}
                    >
                      {actionLabel(s)}
                    </button>
                  ))}
                  {isActive(b) && b.amount > 0 && owed(b) > 0 && (
                    payFor === b.id ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <input aria-label={t("hx.payInput")} className={`${inputClass} !w-32 !py-2`} inputMode="decimal" value={payValue} onChange={(e) => setPayValue(e.target.value)} placeholder={t("hx.payInput")} />
                        <button type="button" className={`${buttonClass} !px-3 !py-2`} onClick={() => savePaid(b, parseMoney(payValue))}>{t("hx.paySave")}</button>
                        <button type="button" className={ghostButtonClass} onClick={() => savePaid(b, b.amount)}>{t("hx.payAll")}</button>
                      </span>
                    ) : (
                      <button type="button" className={ghostButtonClass} onClick={() => { setPayFor(b.id); setPayValue(""); }}>{t("hx.payRegister")}</button>
                    )
                  )}
                  {isActive(b) && b.amount > 0 && (
                    <button type="button" className={ghostButtonClass} onClick={() => toProfit(b)} title={formatMoneyExact(b.amount, currency, locale)}>
                      {t("host.recordIncome")}
                    </button>
                  )}
                  <button type="button" className={`${ghostButtonClass} ml-auto`} onClick={() => startEdit(b)}>{t("hx.edit")}</button>
                  <button type="button" className={ghostButtonClass} onClick={() => remove(b)} aria-label={`${t("host.delete")} ${b.guestName}`}>
                    {t("host.delete")}
                  </button>
                </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {rows.length > visible && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">{t("entries.showing", { shown: visible, total: rows.length })}</span>
            <button type="button" className={ghostButtonClass} onClick={() => setVisible((v) => v + 20)}>{t("entries.showMore")}</button>
          </div>
        )}
      </section>
    </div>
  );
}
