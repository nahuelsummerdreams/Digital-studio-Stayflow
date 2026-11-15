"use client";

import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadSyncProperties, syncCalendars } from "./data";

const STALE_MS = 30 * 60 * 1000;
const EVERY_MS = 15 * 60 * 1000;

/**
 * Keeps the linked calendars (iCal) reasonably fresh: when Host opens, every 15 minutes while it stays open and visible,
 * and when the tab comes back to the front. Only reads calendars not read in the last 30 minutes. Silent on failure.
 */
export function useAutoSync(client: SupabaseClient, orgId: string, onDone: () => Promise<void>): void {
  useEffect(() => {
    if (!orgId) return;
    let live = true;
    let running = false;
    const check = async () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      try {
        const props = await loadSyncProperties(client, orgId);
        const stale = props.some((p) => p.icalUrl && (!p.syncedAt || Date.now() - new Date(p.syncedAt).getTime() > STALE_MS));
        if (!stale || !live) return;
        await syncCalendars(client);
        if (live) await onDone();
      } catch {
        // The sync screen shows the real status; opening the app must never fail because of it.
      } finally {
        running = false;
      }
    };
    void check();
    const id = setInterval(() => void check(), EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      live = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [client, orgId]); // eslint-disable-line react-hooks/exhaustive-deps
}
