"use client";

import { useMemo, useState, type FormEvent } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import { buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { archiveProperty, createUnits, ensureEstablishment, toMinor, type Property } from "../api";

const SUGGEST_HOTEL = ["Simple", "Doble", "Triple", "Suite", "Familiar"];
const SUGGEST_HOSTEL = ["Compartido mixto", "Compartido femenino", "Privada"];

function money(minor: number | null | undefined, currency: string): string {
  if (!minor) return "";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(minor / 100);
  } catch {
    return String(minor / 100);
  }
}

/**
 * Hotels and hostels think in rooms (and beds), not in "establishments": the one establishment is created for you.
 * Hotel: add rooms by type with a nightly rate. Hostel: add dorms with their beds, or private rooms.
 */
export function UnitsManager() {
  const t = useT();
  const { client, org, allProperties, refresh } = useAccount();
  const hostel = org?.lodgingType === "hostel";
  const establishments = allProperties.filter((p) => !p.parentId);
  const rooms = useMemo(() => allProperties.filter((p) => p.unitKind === "room"), [allProperties]);
  const bedsOf = (id: string) => allProperties.filter((p) => p.parentId === id && p.unitKind === "bed");
  const categories = useMemo(() => [...new Set(rooms.map((r) => r.roomCategory).filter((c): c is string => Boolean(c)))], [rooms]);

  const [count, setCount] = useState("1");
  const [prefix, setPrefix] = useState("");
  const [category, setCategory] = useState("");
  const [rate, setRate] = useState("");
  const [bedsPer, setBedsPer] = useState("6");
  const [bedRoom, setBedRoom] = useState("");
  const [bedCount, setBedCount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  if (!org) return null;
  const kind = hostel ? "hostel" : "hotel";

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  const addRooms = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(count);
    const baseRate = rate.trim() === "" ? undefined : (toMinor(rate) ?? undefined);
    const shared = hostel && Number(bedsPer) > 0 && /compartid/i.test(category);
    return run(async () => {
      if (!org) return;
      const parent = await ensureEstablishment(client, org.id, org.name, establishments[0]);
      const base = prefix.trim() || (hostel && !shared ? t("units.prefix_private") : t(`units.prefix_${kind}`));
      const ids = await createUnits(client, org.id, { parentId: parent, kind: "room", prefix: base, count: n, startAt: rooms.length + 1, category, baseRate: shared ? undefined : baseRate });
      if (shared) {
        for (const id of ids) await createUnits(client, org.id, { parentId: id, kind: "bed", prefix: t("units.prefix_bed"), count: Number(bedsPer), baseRate });
      }
      setInfo(t(`units.added_${kind}`, { n }));
      setCount("1");
      setPrefix("");
    });
  };

  const addBeds = (e: FormEvent) => {
    e.preventDefault();
    return run(async () => {
      if (!org || !bedRoom) return;
      const rate0 = toMinor(rate) ?? undefined;
      await createUnits(client, org.id, { parentId: bedRoom, kind: "bed", prefix: t("units.prefix_bed"), count: Number(bedCount), startAt: bedsOf(bedRoom).length + 1, baseRate: rate0 });
      setInfo(t("units.added_bed", { n: Number(bedCount) }));
      setBedCount("1");
    });
  };

  const archive = (r: Property) =>
    run(async () => {
      if (!window.confirm(t("units.archiveConfirm", { name: r.name }))) return;
      await archiveProperty(client, r.id);
    });

  const groups = useMemo(() => {
    const map = new Map<string, Property[]>();
    for (const r of rooms) map.set(r.roomCategory || t("units.noCategory"), [...(map.get(r.roomCategory || t("units.noCategory")) ?? []), r]);
    return [...map.entries()];
  }, [rooms, t]);

  const suggestions = [...new Set([...(hostel ? SUGGEST_HOSTEL : SUGGEST_HOTEL), ...categories])];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem] xl:items-start">
      <section className="space-y-4" aria-label={t(`units.title_${kind}`)}>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        {info && <p role="status" className="rounded-xl border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">{info}</p>}
        {rooms.length === 0 ? (
          <p className={`${cardClass} text-sm text-muted`}>{t(`units.empty_${kind}`)}</p>
        ) : (
          groups.map(([cat, list]) => (
            <div key={cat} className={`${cardClass} !p-5`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium">{cat} · {t(`units.count_${kind}`, { n: list.length })}</h2>
                {list[0]?.baseRate ? <span className="text-xs text-muted">{t("units.rate", { amount: money(list[0].baseRate, org.currency) })}</span> : null}
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {list.map((r) => (
                  <li key={r.id} className="group flex items-center gap-2 rounded-lg border border-line bg-surface/50 px-3 py-1.5 text-sm">
                    <span>{r.name}</span>
                    {hostel && bedsOf(r.id).length > 0 ? <span className="text-xs text-muted">· {t("units.beds", { n: bedsOf(r.id).length })}</span> : null}
                    <button type="button" aria-label={t("units.archiveLabel", { name: r.name })} onClick={() => void archive(r)} className="text-muted opacity-60 transition hover:text-danger group-hover:opacity-100">×</button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <div className="space-y-4 xl:sticky xl:top-8">
        <form onSubmit={addRooms} className={`${cardClass} space-y-4`}>
          <h2 className="text-sm font-medium">{t(`units.add_${kind}`)}</h2>
          <p className="text-xs text-muted">{t(`units.addHint_${kind}`)}</p>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>{t("units.count")}<input className={inputClass} type="number" min={1} max={200} value={count} onChange={(e) => setCount(e.target.value)} required /></label>
            <label className={labelClass}>{t("units.prefix")}<input className={inputClass} value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder={t(`units.prefix_${kind}`)} maxLength={60} /></label>
          </div>
          <label className={labelClass}>
            {t(`units.category_${kind}`)}
            <input className={inputClass} list="units-categories" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} />
            <datalist id="units-categories">{suggestions.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>{t(`units.rate_${kind}`, { currency: org.currency })}<input className={inputClass} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0" /></label>
            {hostel && /compartid/i.test(category) && <label className={labelClass}>{t("units.bedsPer")}<input className={inputClass} type="number" min={1} max={60} value={bedsPer} onChange={(e) => setBedsPer(e.target.value)} /></label>}
          </div>
          <button className={`${buttonClass} w-full`} disabled={busy}>{busy ? t("units.adding") : t(`units.addButton_${kind}`)}</button>
        </form>

        {hostel && rooms.length > 0 && (
          <form onSubmit={addBeds} className={`${cardClass} space-y-4`}>
            <h2 className="text-sm font-medium">{t("units.addBedsTitle")}</h2>
            <label className={labelClass}>{t("units.inRoom")}
              <select className={inputClass} value={bedRoom} onChange={(e) => setBedRoom(e.target.value)} required>
                <option value="">{t("units.pickRoom")}</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label className={labelClass}>{t("units.count")}<input className={inputClass} type="number" min={1} max={60} value={bedCount} onChange={(e) => setBedCount(e.target.value)} required /></label>
            <button className={`${ghostButtonClass} w-full`} disabled={busy || !bedRoom}>{t("units.addBedsButton")}</button>
          </form>
        )}
      </div>
    </div>
  );
}
