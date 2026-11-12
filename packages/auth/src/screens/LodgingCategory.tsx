"use client";

import { useState } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import { buttonClass, cardClass, errorClass, ghostButtonClass, infoClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { previewLodgingChange, setLodgingType, type LodgingChangePreview, type LodgingType } from "../api";
import { LodgingPicker } from "./LodgingPicker";

/** The category of the business, and the controlled way to change it: see what changes first, then confirm. Data is never touched. */
export function LodgingCategory({ onError }: { onError?: (m: string | null) => void }) {
  const t = useT();
  const { client, org, refresh } = useAccount();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<LodgingType | null>(null);
  const [preview, setPreview] = useState<LodgingChangePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<LodgingType | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!org) return null;
  const current = org.lodgingType;

  function reset() {
    setOpen(false);
    setTarget(null);
    setPreview(null);
    setError(null);
  }

  async function pick(next: LodgingType) {
    setDone(null);
    setError(null);
    setPreview(null);
    if (!org || next === current) return setTarget(null);
    setTarget(next);
    setLoading(true);
    try {
      setPreview(await previewLodgingChange(client, org.id, next));
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!org || !target) return;
    setBusy(true);
    setError(null);
    onError?.(null);
    try {
      await setLodgingType(client, org.id, target);
      await refresh();
      setDone(target);
      reset();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  const list = (keys: string[]) => keys.map((k) => t(`module.${k as "dashboard"}`)).join(", ");
  const brand = (k: LodgingType) => t(`category.${k}.brand`);

  return (
    <section className={`${cardClass} space-y-4`} aria-label={t("category.changeTitle")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{t("category.current")}</p>
          <p className="font-display text-xl uppercase tracking-wide">{brand(current)}</p>
        </div>
        {!open && <button type="button" className={ghostButtonClass} onClick={() => setOpen(true)}>{t("category.change")}</button>}
      </div>
      {done && !open && <p role="status" className={infoClass}>{t("category.changed", { brand: brand(done) })}</p>}
      {open && (
        <div className="space-y-4">
          <LodgingPicker value={target ?? current} onChange={(k) => void pick(k)} disabled={busy} />
          {loading && <p className="text-sm text-muted">{t("category.previewLoading")}</p>}
          {preview && !preview.allowed && (
            <p role="alert" className={errorClass}>
              {preview.reason === "has_beds" ? t("category.blockedBeds", { beds: preview.beds, brand: brand(preview.target) }) : t("category.blockedUnits", { rooms: preview.rooms, beds: preview.beds, brand: brand(preview.target) })}
            </p>
          )}
          {preview?.allowed && (
            <div className="space-y-1.5 rounded-xl border border-line bg-bg/40 p-4 text-sm">
              {preview.enable.length > 0 && <p>{t("category.willEnable", { list: list(preview.enable) })}</p>}
              {preview.disable.length > 0 && <p>{t("category.willHide", { list: list(preview.disable) })}</p>}
              {preview.enable.length === 0 && preview.disable.length === 0 && <p>{t("category.noMenuChange")}</p>}
              <p className="text-muted">{t("category.dataSafe")}</p>
            </div>
          )}
          {error && <p role="alert" className={errorClass}>{error}</p>}
          <div className="flex flex-wrap gap-2">
            {preview?.allowed && target && <button type="button" className={buttonClass} disabled={busy} onClick={confirm}>{busy ? t("category.changing") : t("category.confirm", { brand: brand(target) })}</button>}
            <button type="button" className={ghostButtonClass} disabled={busy} onClick={reset}>{t("category.cancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
