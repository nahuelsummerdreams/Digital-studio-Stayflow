"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadChecklists, loadJobs, loadRecurring, loadStaff, syncOperations } from "./data";
import { addDays, localToday } from "./dates";
import type { Checklist, Job, Recurring, Staff } from "./types";

export interface OpsData {
  jobs: Job[];
  staff: Staff[];
  checklists: Checklist[];
  recurring: Recurring[];
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
}

const OpsContext = createContext<OpsData | null>(null);

/**
 * Loads everything of one business once and shares it with every screen. On open it first brings the jobs up to date
 * with the Host bookings and the recurring maintenance, so the day is already planned when you look at it.
 */
export function OpsDataProvider({ client, orgId, enabled = true, children }: { client: SupabaseClient; orgId: string; /** Wait for the license: before it exists the database refuses everything. */ enabled?: boolean; children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    const [j, s, c, r] = await Promise.all([loadJobs(client, orgId, addDays(localToday(), -45)), loadStaff(client, orgId), loadChecklists(client, orgId), loadRecurring(client, orgId)]);
    setJobs(j);
    setStaff(s);
    setChecklists(c);
    setRecurring(r);
    setError(false);
  }, [client, orgId]);

  const reload = useCallback(async () => {
    if (!orgId) return;
    try {
      await fetchAll();
    } catch {
      setError(true);
    }
  }, [fetchAll, orgId]);

  useEffect(() => {
    if (!orgId || !enabled) return;
    let live = true;
    void (async () => {
      try {
        await syncOperations(client, orgId).catch(() => undefined); // a failed sync must not hide the jobs you already have
        if (live) await fetchAll();
      } catch {
        if (live) setError(true);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [client, orgId, enabled, fetchAll]);

  const value = useMemo(() => ({ jobs, staff, checklists, recurring, loading, error, reload }), [jobs, staff, checklists, recurring, loading, error, reload]);
  return createElement(OpsContext.Provider, { value }, children);
}

export function useOpsData(): OpsData {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error("useOpsData must be used inside <OpsDataProvider>");
  return ctx;
}
