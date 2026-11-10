"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadLedger, type Ledger } from "./data";

const EMPTY: Ledger = { incomes: [], expenses: [] };

export function useLedger(client: SupabaseClient, orgId: string) {
  const [ledger, setLedger] = useState<Ledger>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setLedger(await loadLedger(client, orgId));
    } catch {
      setError("We could not load your numbers. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [client, orgId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ledger, loading, error, reload };
}
