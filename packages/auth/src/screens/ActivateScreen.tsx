"use client";

import { useState, type FormEvent } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import type { ProductKey } from "@stayflow/licensing";
import { BrandStage, buttonClass, cardClass, errorClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { redeemLicenseCode } from "../api";

const DEFAULT_STORE = "https://stayflow-web-livid.vercel.app";

/** Shown when the organization has no valid license for this app: paste the code that came with the purchase. */
export function ActivateScreen({ product, productName, buyUrl }: { product: ProductKey; productName: string; buyUrl?: string }) {
  const t = useT();
  const { client, org, licenses, refresh, signOut } = useAccount();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A license row that is no longer valid means the plan already ended.
  const ended = licenses.some((l) => l.product === product);

  async function activate(e: FormEvent) {
    e.preventDefault();
    if (!org) return;
    setBusy(true);
    setError(null);
    try {
      await redeemLicenseCode(client, org.id, code);
      await refresh();
    } catch (err) {
      const c = (err as { code?: string } | null)?.code;
      setError(c === "P0002" ? t("activate.invalid") : t(errorKey(err)));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-10">
      <BrandStage product={productName} compact />
      <form onSubmit={activate} className={`${cardClass} mt-8 space-y-4`}>
        <h1 className="font-display text-2xl leading-tight">{ended ? t("activate.endedTitle", { product: productName }) : t("activate.title", { product: productName })}</h1>
        <p className="text-sm text-muted">{ended ? t("activate.endedBody") : t("activate.body")}</p>
        <label className={labelClass}>
          {t("activate.code")}
          <input className={`${inputClass} font-mono tracking-wider`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="SF-XXXX-XXXX-XXXX" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={32} required />
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy || code.trim() === ""}>{busy ? t("activate.busy") : t("activate.go")}</button>
        <p className="text-center text-xs text-muted">
          {t("activate.noCode")}{" "}
          <a className="text-accent underline-offset-4 hover:underline" href={`${buyUrl ?? DEFAULT_STORE}${product === "host" ? "/products/host" : `/products/${product}`}`} target="_blank" rel="noopener noreferrer">{t("activate.buy", { product: productName })}</a>
        </p>
      </form>
      <button type="button" onClick={signOut} className="mt-4 text-sm text-muted underline-offset-4 hover:underline">
        {t("common.signOut")}
      </button>
    </main>
  );
}
