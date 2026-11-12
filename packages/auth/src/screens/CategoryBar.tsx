"use client";

import { useState } from "react";
import { useT } from "@stayflow/i18n";
import { useAccount } from "../account";
import { LODGING_TYPES, type LodgingType } from "../api";
import { LodgingCategory } from "./LodgingCategory";

const DOT: Record<LodgingType, string> = { rental: "bg-success", hotel: "bg-amber-400", hostel: "bg-amber-400", cabins: "bg-muted" };

/**
 * The first thing in the panel: the four categories, side by side. The current one is lit;
 * choosing another shows what changes and asks to confirm. Data is never touched.
 */
export function CategoryBar() {
  const t = useT();
  const { org } = useAccount();
  const [target, setTarget] = useState<LodgingType | null>(null);
  if (!org) return null;
  const current = org.lodgingType;
  return (
    <section aria-label={t("category.barTitle")} className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{t("category.barTitle")}</p>
      <div role="radiogroup" aria-label={t("category.barTitle")} className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {LODGING_TYPES.map((k) => {
          const on = k === current;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTarget(on ? null : k)}
              className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${on ? "border-accent bg-accent/15 shadow-[0_0_0_1px_rgb(var(--accent)/0.5)]" : target === k ? "border-accent/60 bg-accent/5" : "border-line hover:border-accent/50 hover:bg-accent/5"}`}
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[k]}`} aria-hidden />
              <span className="min-w-0">
                <span className={`block truncate font-display text-base uppercase tracking-wide ${on ? "text-accent" : ""}`}>{t(`category.${k}.brand`).replace(/^Stayflow /, "")}</span>
                <span className="block truncate text-xs text-muted">{on ? t("category.barCurrent") : t(`category.${k}.short`)}</span>
              </span>
            </button>
          );
        })}
      </div>
      {target && <LodgingCategory key={target} initialTarget={target} onClose={() => setTarget(null)} />}
    </section>
  );
}
