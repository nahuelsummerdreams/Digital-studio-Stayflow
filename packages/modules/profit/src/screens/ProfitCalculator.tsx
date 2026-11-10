"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n } from "@stayflow/i18n";
import { cardClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { breakEvenNights, suggestedNightlyRate } from "../calc";
import { loadRecurring } from "../data";
import { formatMoney, formatMoneyExact, parseMoney } from "../money";

interface Props {
  client: SupabaseClient;
  orgId: string;
  currency: string;
}

/** Plain number from user text: accepts "3", "3,5" and "3.5". */
function parseNumber(input: string): number {
  const n = Number(input.trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function ProfitCalculator({ client, orgId, currency }: Props) {
  const { t, locale } = useI18n();
  const [fixed, setFixed] = useState("");
  const [variable, setVariable] = useState("");
  const [commission, setCommission] = useState("3");
  const [target, setTarget] = useState("");
  const [nights, setNights] = useState("");
  const [currentRate, setCurrentRate] = useState("");
  const [fixedFromData, setFixedFromData] = useState(0);

  useEffect(() => {
    let alive = true;
    loadRecurring(client, orgId)
      .then((rows) => {
        if (alive) setFixedFromData(rows.filter((r) => r.active).reduce((s, r) => s + r.amount, 0));
      })
      .catch(() => {
        /* The shortcut button is optional. */
      });
    return () => {
      alive = false;
    };
  }, [client, orgId]);

  const money = (n: number) => formatMoney(n, currency, locale);
  const fixedMinor = parseMoney(fixed) ?? 0;
  const variableMinor = parseMoney(variable) ?? 0;
  const targetMinor = parseMoney(target) ?? 0;
  const commissionPct = Math.min(100, Math.max(0, parseNumber(commission)));
  const nightsN = Math.floor(parseNumber(nights));

  const rate =
    nightsN > 0
      ? suggestedNightlyRate({
          fixedCostsMonthly: fixedMinor,
          variableCostPerNight: variableMinor,
          targetProfitMonthly: targetMinor,
          expectedNightsMonthly: nightsN,
          platformCommissionPct: commissionPct,
        })
      : null;
  const profitAtRate =
    rate === null ? 0 : nightsN * (rate - Math.round((rate * commissionPct) / 100) - variableMinor) - fixedMinor;

  const currentMinor = parseMoney(currentRate);
  const needed =
    currentMinor !== null && currentMinor > 0
      ? breakEvenNights({
          fixedCostsMonthly: fixedMinor,
          nightlyRate: currentMinor,
          variableCostPerNight: variableMinor,
          platformCommissionPct: commissionPct,
        })
      : undefined;

  const field = (label: string, value: string, set: (v: string) => void, placeholder = "0") => (
    <label className={labelClass}>
      {label}
      <input className={inputClass} inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
    </label>
  );

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <h2 className="text-sm font-medium">{t("calculator.title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("calculator.intro")}</p>
      </section>

      <section className={`${cardClass} space-y-4`}>
        <div>
          {field(t("calculator.fixedCosts"), fixed, setFixed)}
          {fixedFromData > 0 && (
            <button
              type="button"
              className={`${ghostButtonClass} mt-2`}
              onClick={() => setFixed(String(fixedFromData / 100).replace(".", ","))}
            >
              {t("calculator.useMyFixed", { amount: formatMoneyExact(fixedFromData, currency, locale) })}
            </button>
          )}
        </div>
        {field(t("calculator.variableCost"), variable, setVariable)}
        <div className="grid grid-cols-2 items-end gap-3">
          {field(t("calculator.commission"), commission, setCommission, "3")}
          {field(t("calculator.expectedNights"), nights, setNights, "15")}
        </div>
        {field(t("calculator.targetProfit"), target, setTarget)}
      </section>

      <section className={cardClass} aria-live="polite">
        <h2 className="text-sm font-medium">{t("calculator.resultTitle")}</h2>
        {nightsN <= 0 ? (
          <p className="mt-3 text-sm text-muted">{t("calculator.needNights")}</p>
        ) : rate === null ? (
          <p className="mt-3 text-sm text-danger">{t("calculator.impossible")}</p>
        ) : (
          <>
            <p className="mt-1 font-display text-5xl text-money">{money(rate)}</p>
            <p className="mt-3 text-sm text-muted">
              {t("calculator.resultBody", { nights: nightsN, profit: money(profitAtRate) })}
            </p>
          </>
        )}
      </section>

      <section className={`${cardClass} space-y-4`} aria-live="polite">
        <h2 className="text-sm font-medium">{t("calculator.breakEvenTitle")}</h2>
        {field(t("calculator.currentRate"), currentRate, setCurrentRate)}
        {needed === undefined ? (
          <p className="text-sm text-muted">{t("calculator.breakEvenHint")}</p>
        ) : needed === null ? (
          <p className="text-sm text-danger">{t("calculator.losing")}</p>
        ) : (
          <p className="text-sm">{t("calculator.breakEvenBody", { count: needed })}</p>
        )}
      </section>
    </div>
  );
}
