"use client";

import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadSyncProperties, syncCalendars } from "./data";

const STALE_MS = 30 * 60 * 1000;

/** When Host opens, refreshes the linked calendars that have not been read in the last 30 minutes. Silent on failure. */
export function useAutoSync(client: SupabaseClient, orgId: string, onDone: () => Promise<void>): void {
  useEffect(() => {
    if (!orgId) return;
    let live = true;
    void (async () => {
      try {
        const props = await loadSyncProperties(client, orgId);
        const stale = props.some((p) => p.icalUrl && (!p.syncedAt || Date.now() - new Date(p.syncedAt).getTime() > STALE_MS));
        if (!stale || !live) return;
        await syncCalendars(client);
        if (live) await onDone();
      } catch {
        // The sync screen shows the real status; opening the app must never fail because of it.
      }
    })();
    return () => {
      live = false;
    };
  }, [client, orgId]); // eslint-disable-line react-hooks/exhaustive-deps
}
