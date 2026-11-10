"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadBookings, loadTasks } from "./data";
import type { Booking, HostTask } from "./types";

/** Bookings and tasks of one organization, with a single reload. */
export function useHostData(client: SupabaseClient, orgId: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<HostTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [b, t] = await Promise.all([loadBookings(client, orgId), loadTasks(client, orgId)]);
      setBookings(b);
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

  return { bookings, tasks, loading, error, reload };
}
