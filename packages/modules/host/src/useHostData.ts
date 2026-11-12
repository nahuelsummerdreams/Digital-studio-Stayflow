"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n } from "@stayflow/i18n";
import { loadBlocks, loadBookings, loadTasks } from "./data";
import type { Booking, HostTask, LodgingType } from "./types";

export interface HostData {
  bookings: Booking[];
  /** Dates held for maintenance or own use. Kept apart: they never count as guests, income or occupancy. */
  blocks: Booking[];
  tasks: HostTask[];
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
  /** What this business reserves: properties, cabins, rooms or beds. Screens use it to speak the right words. */
  lodgingType: LodgingType;
}

const HostDataContext = createContext<HostData | null>(null);

/**
 * Loads the bookings and tasks of one organization once and shares them with every screen, the side menu badges
 * and the bell. Screens call `reload()` after a change and everything updates together.
 */
export function HostDataProvider({ client, orgId, lodgingType = "rental", children }: { client: SupabaseClient; orgId: string; lodgingType?: LodgingType; children: ReactNode }) {
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

  const value = useMemo(() => ({ bookings, blocks, tasks, loading, error, reload, lodgingType }), [bookings, blocks, tasks, loading, error, reload, lodgingType]);
  return createElement(HostDataContext.Provider, { value }, children);
}

export function useHostData(): HostData {
  const ctx = useContext(HostDataContext);
  if (!ctx) throw new Error("useHostData must be used inside <HostDataProvider>");
  return ctx;
}

/** The words of this category: "propiedad", "cabaña", "habitación" or "cama", with their plural and the actions around them. */
export function useUnit() {
  const { t } = useI18n();
  const { lodgingType } = useHostData();
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  return {
    type: lodgingType,
    one: t(`unit.${lodgingType}.one`),
    many: t(`unit.${lodgingType}.many`),
    /** "Habitación", for field labels. */
    label: cap(t(`unit.${lodgingType}.one`)),
    /** "Habitaciones", for column titles. */
    labelMany: cap(t(`unit.${lodgingType}.many`)),
    add: t(`unit.${lodgingType}.add`),
    addFirst: t(`unit.${lodgingType}.addFirst`),
  };
}
