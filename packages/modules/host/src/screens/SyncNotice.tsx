"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n } from "@stayflow/i18n";
import { Icon, ghostButtonClass } from "@stayflow/ui";
import { loadSyncProperties, syncCalendars, type SyncProperty } from "../data";
import { agoLabel, syncHealth } from "../syncHealth";

interface Props {
  client: SupabaseClient;
  orgId: string;
  /** Reload the Host data after a sync. */
  onDone: () => Promise<void>;
}

/**
 * A quiet notice at the top of Host when the linked calendars are old, could not be read, or overlap the host's own reservations.
 * It says how old the data is and reminds that Airbnb and Booking read Host's calendar at their own pace. Nothing shows when all is fresh.
 */
export function SyncNotice({ client, orgId, onDone }: Props) {
  const { t } = useI18n();
  const [props, setProps] = useState<SyncProperty[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setProps(await loadSyncProperties(client, orgId));
    } catch {
      setProps([]); // the notice is a courtesy: never block the app because of it
    }
    setNow(Date.now());
  }, [client, orgId]);

  useEffect(() => {
    if (!orgId) return;
    void load();
    const id = setInterval(() => void load(), 5 * 60_000);
    return () => clearInterval(id);
  }, [orgId, load]);

  if (!props) return null;
  const h = syncHealth(props, now);
  if (!h.needsAttention) return null;

  const tone = h.errors > 0 ? "border-danger/40 bg-danger/10 text-danger" : h.conflicts > 0 ? "border-amber-400/40 bg-amber-400/10 text-amber-200" : "border-accent/30 bg-accent/10 text-fg";
  let text: string;
  if (h.errors > 0) text = t("hx.syncNoticeError", { count: h.errors });
  else if (h.conflicts > 0) text = t("hx.syncNoticeConflict", { count: h.conflicts });
  else if (h.oldestMinutes === null) text = t("hx.syncNoticeNever");
  else {
    const a = agoLabel(h.oldestMinutes);
    text = t("hx.syncNoticeStale", { when: `${a.n} ${a.unit}` });
  }

  async function syncNow() {
    setBusy(true);
    try {
      await syncCalendars(client);
      await load();
      await onDone();
    } catch {
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="status" className={`mb-5 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${tone}`}>
      <Icon name={h.errors > 0 || h.conflicts > 0 ? "alert" : "refresh"} className="h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1 leading-snug">{text}</p>
      <button type="button" disabled={busy} onClick={() => void syncNow()} className={`${ghostButtonClass} !px-3 !py-1.5 text-xs`}>
        {busy ? t("hx.syncing") : t("hx.syncNow")}
      </button>
    </div>
  );
}
