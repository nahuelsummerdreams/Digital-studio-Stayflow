"use client";

import { useState } from "react";
import type { ProductKey } from "@stayflow/licensing";
import { buttonClass, cardClass, errorClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { errorMessage, startTrial } from "../api";

/** Shown when the organization has no valid license for this app. */
export function TrialScreen({ product, productName }: { product: ProductKey; productName: string }) {
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
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-14">
      <section className={cardClass}>
        {ended ? (
          <>
            <h1 className="font-display text-3xl leading-tight">Your {productName} plan has ended.</h1>
            <p className="mt-3 text-sm text-black/60">
              Your data is safe. Renew your plan to pick up right where you left off.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl leading-tight">Try {productName} free for 14 days.</h1>
            <p className="mt-3 text-sm text-black/60">No card needed. Add your properties and see your real numbers.</p>
            {error && <p role="alert" className={`${errorClass} mt-4`}>{error}</p>}
            <button className={`${buttonClass} mt-6 w-full`} onClick={begin} disabled={busy}>
              {busy ? "Starting…" : "Start free trial"}
            </button>
          </>
        )}
      </section>
      <button type="button" onClick={signOut} className="mt-4 text-sm text-black/60 underline-offset-4 hover:underline">
        Sign out
      </button>
    </main>
  );
}
