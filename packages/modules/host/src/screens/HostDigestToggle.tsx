"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useI18n } from "@stayflow/i18n";
import { cardClass } from "@stayflow/ui";

/** Turns the morning email ("tu día") on or off for the whole organization. */
export function HostDigestToggle({ client, orgId }: { client: SupabaseClient; orgId: string }) {
  const { t } = useI18n();
  const [on, setOn] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void client
      .from("organizations")
      .select("digest_enabled")
      .eq("id", orgId)
      .single()
      .then(({ data }) => live && setOn(data ? Boolean((data as { digest_enabled: boolean }).digest_enabled) : null));
    return () => {
      live = false;
    };
  }, [client, orgId]);

  if (on === null) return null;
  async function flip() {
    const next = !on;
    setFailed(false);
    setOn(next);
    const { error } = await client.from("organizations").update({ digest_enabled: next }).eq("id", orgId);
    if (error) {
      setOn(!next);
      setFailed(true);
    }
  }
  return (
    <div className={`${cardClass} flex items-center justify-between gap-4 !p-4`}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{t("hx.digestTitle")}</p>
        <p className="text-xs text-muted">{failed ? t("hx.digestErr") : t("hx.digestBody")}</p>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label={t("hx.digestTitle")} onClick={flip} className={`relative h-6 w-11 shrink-0 rounded-full border transition ${on ? "border-accent bg-accent" : "border-line bg-bg/60"}`}>
        <span className={`absolute top-0.5 w-[18px] rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} style={{ height: 18 }} />
      </button>
    </div>
  );
}
