"use client";

import { useState } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import type { ProductKey } from "@stayflow/licensing";
import { buttonClass, cardClass, errorClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { startTrial } from "../api";

/** Shown when the organization has no valid license for this app. */
export function TrialScreen({ product, productName }: { product: ProductKey; productName: string }) {
  const t = useT();
  const { client, org, licenses, refresh, signOut } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A license row that is no longer valid means the trial or plan already ended.
  const ended = licenses.some((l) => l.product === product);

  async function begin() {
    if (!org) return;
    setBusy(true);
    setError(null);
    try {
      await startTrial(client, org.id, product);
      await refresh();
    } catch (err) {
      setError(t(errorKey(err)));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-14">
      <section className={cardClass}>
        {ended ? (
          <>
            <h1 className="font-display text-3xl leading-tight">{t("trial.endedTitle", { product: productName })}</h1>
            <p className="mt-3 text-sm text-muted">{t("trial.endedBody")}</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl leading-tight">{t("trial.title", { product: productName })}</h1>
            <p className="mt-3 text-sm text-muted">{t("trial.body")}</p>
            {error && <p role="alert" className={`${errorClass} mt-4`}>{error}</p>}
            <button className={`${buttonClass} mt-6 w-full`} onClick={begin} disabled={busy}>
              {busy ? t("trial.starting") : t("trial.start")}
            </button>
          </>
        )}
      </section>
      <button type="button" onClick={signOut} className="mt-4 text-sm text-muted underline-offset-4 hover:underline">
        {t("common.signOut")}
      </button>
    </main>
  );
}
