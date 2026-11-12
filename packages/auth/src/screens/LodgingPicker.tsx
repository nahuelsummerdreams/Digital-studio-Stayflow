"use client";

import { useT } from "@stayflow/i18n";
import { Icon, Pill } from "@stayflow/ui";
import { LODGING_TYPES, type LodgingType } from "../api";
import { LodgingArt } from "./LodgingArt";

/** How far along each category is. Honest on purpose: nothing is presented as finished when it is not. */
const STATUS: Record<LodgingType, "available" | "beta" | "soon"> = { rental: "available", hotel: "beta", hostel: "beta", cabins: "soon" };
const TONE = { available: "success", beta: "warning", soon: "muted" } as const;

/** The four categories as cards: picture, name, who it is for, main functions and a button. */
export function LodgingPicker({ value, onChange, disabled = false }: { value: LodgingType; onChange: (next: LodgingType) => void; disabled?: boolean }) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={t("category.chooseTitle")} className="grid gap-4 sm:grid-cols-2">
      {LODGING_TYPES.map((k) => {
        const selected = value === k;
        const features = t(`category.${k}.features`).split("|");
        const status = STATUS[k];
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(k)}
            className={`fx-card group flex flex-col overflow-hidden rounded-2xl border text-left transition ${selected ? "border-accent shadow-[0_0_0_1px_rgb(var(--accent)),0_18px_50px_-20px_rgb(var(--accent)/0.7)]" : "border-line hover:border-accent/50"} disabled:opacity-60`}
          >
            <span className="block h-28 overflow-hidden"><LodgingArt type={k} /></span>
            <span className="flex flex-1 flex-col p-4">
              <span className="flex items-start justify-between gap-2">
                <span className="font-display text-lg uppercase leading-tight tracking-wide">{t(`category.${k}.brand`)}</span>
                <Pill tone={TONE[status]}>{t(`category.status.${status}`)}</Pill>
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-muted">{t(`category.${k}.audience`)}</span>
              <ul className="mt-3 flex-1 space-y-1.5 text-[13px]">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /><span>{f}</span></li>
                ))}
              </ul>
              {k === "cabins" && <span className="mt-3 block rounded-lg border border-dashed border-line px-3 py-2 text-xs text-muted">{t("category.cabins.note")}</span>}
              <span className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${selected ? "bg-accent text-onaccent" : "border border-line text-fg"}`}>
                {selected ? (<><Icon name="check" className="h-4 w-4" />{t("category.chosen")}</>) : t("category.choose")}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
