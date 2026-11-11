"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadBlocks, loadBookings, loadTasks } from "./data";
import type { Booking, HostTask } from "./types";

export interface HostData {
  bookings: Booking[];
  /** Dates held for maintenance or own use. Kept apart: they never count as guests, income or occupancy. */
  blocks: Booking[];
  tasks: HostTask[];
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
}

const HostDataContext = createContext<HostData | null>(null);

/**
 * Loads the bookings and tasks of one organization once and shares them with every screen, the side menu badges
 * and the bell. Screens call `reload()` after a change and everything updates together.
 */
export function HostDataProvider({ client, orgId, children }: { client: SupabaseClient; orgId: string; children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<HostTask[]>([]);
  const [loading, setLoading] = useState(Boolean(orgId));
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    if (!orgId) return;
    try {
      const [b, k, t] = await Promise.all([loadBookings(client, orgId), loadBlocks(client, orgId), loadTasks(client, orgId)]);
      setBookings(b);
      setBlocks(k);
      setTasks(t);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [client, orgId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(() => ({ bookings, blocks, tasks, loading, error, reload }), [bookings, blocks, tasks, loading, error, reload]);
  return createElement(HostDataContext.Provider, { value }, children);
}

export function useHostData(): HostData {
  const ctx = useContext(HostDataContext);
  if (!ctx) throw new Error("useHostData must be used inside <HostDataProvider>");
  return ctx;
}
