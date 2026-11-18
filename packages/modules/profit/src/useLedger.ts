"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadLedger, type Ledger } from "./data";

const EMPTY: Ledger = { incomes: [], expenses: [] };

/** `collected: true` shows income as what guests actually paid (see collectedIncomes). */
export function useLedger(client: SupabaseClient, orgId: string, opts: { collected?: boolean } = {}) {
  const collected = Boolean(opts.collected);
  const [ledger, setLedger] = useState<Ledger>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setLedger(await loadLedger(client, orgId, { collected }));
    } catch {
      setError("We could not load your numbers. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [client, orgId, collected]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ledger, loading, error, reload };
}
