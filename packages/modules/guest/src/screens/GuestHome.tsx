"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useT } from "@stayflow/i18n";
import { buttonClass, cardClass, errorClass, ghostButtonClass } from "@stayflow/ui";
import { createGuide, loadGuideSummaries, type GuideSummary } from "../data";
import { completeness } from "../helpers";

interface Props {
  client: SupabaseClient;
  orgId: string;
  properties: { id: string; name: string }[];
  onOpen: (propertyId: string) => void;
  onGoProperties: () => void;
}

export function GuestHome({ client, orgId, properties, onOpen, onGoProperties }: Props) {
  const t = useT();
  const [summaries, setSummaries] = useState<GuideSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setSummaries(await loadGuideSummaries(client, orgId));
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setLoading(false);
    }
  }, [client, orgId, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function create(propertyId: string, name: string) {
    setBusyId(propertyId);
    setError(null);
    try {
      await createGuide(client, { orgId, propertyId, title: t("guest.defaultTitle", { property: name }) });
      onOpen(propertyId);
    } catch (err) {
      setError(t(errorKey(err)));
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <h2 className="text-sm font-medium">{t("guest.homeTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t("guest.homeIntro")}</p>
      </section>

      {error && <p role="alert" className={errorClass}>{error}</p>}

      {properties.length === 0 ? (
        <section className={cardClass}>
          <p className="text-sm text-muted">{t("guest.needProperty")}</p>
          <button type="button" className={`${buttonClass} mt-4`} onClick={onGoProperties}>
            {t("guest.goProperties")}
          </button>
        </section>
      ) : loading ? (
        <p className="text-sm text-muted">{t("common.loading")}</p>
      ) : (
        <ul className="space-y-3">
          {properties.map((p) => {
            const s = summaries.find((x) => x.guide.propertyId === p.id);
            const pct = s ? completeness(s.guide, s.itemKinds).pct : 0;
            const status = !s ? t("guest.statusNone") : s.guide.published ? t("guest.statusPublished") : t("guest.statusDraft");
            return (
              <li key={p.id} className={`${cardClass} flex items-center justify-between gap-4 !p-5`}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        s?.guide.published ? "bg-accent/15 text-accent" : "border border-line"
                      }`}
                    >
                      {status}
                    </span>
                    {s && <span>{t("guest.complete", { pct })}</span>}
                  </p>
                </div>
                {s ? (
                  <button type="button" className={ghostButtonClass} onClick={() => onOpen(p.id)}>
                    {t("guest.edit")}
                  </button>
                ) : (
                  <button type="button" className={buttonClass} disabled={busyId === p.id} onClick={() => create(p.id, p.name)}>
                    {busyId === p.id ? t("guest.creating") : t("guest.create")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
