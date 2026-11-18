"use client";

import { LanguageSwitch, useAccount } from "@stayflow/auth";
import { LOCALES, useI18n } from "@stayflow/i18n";
import { HostDigestToggle, HostImport, HostSync, useHostData } from "@stayflow/module-host";
import { cardClass } from "@stayflow/ui";

/** Settings: the language comes first (the product is sold in many countries), then calendar sync and the daily summary. */
export default function SettingsPage() {
  const { t, locale } = useI18n();
  const { client, org, properties } = useAccount();
  const data = useHostData();
  if (!org) return null;
  const current = LOCALES.find((l) => l.code === locale);
  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl sm:text-3xl">{t("complete.settings.title")}</h1>

      <section aria-labelledby="lang-title" className={`${cardClass} space-y-4`}>
        <div>
          <h2 id="lang-title" className="text-sm font-medium">{t("complete.settings.languageTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("complete.settings.languageBody")}</p>
        </div>
        <LanguageSwitch />
        <p className="text-xs text-muted">
          {t("complete.settings.languageCurrent")}: <span lang={locale}>{current?.native}</span>. {t("complete.settings.languageNote")}
        </p>
        <p className="text-xs text-muted">{t("complete.settings.languageMore")}</p>
      </section>

      <h2 className="text-sm font-medium text-muted">{t("complete.settings.syncTitle")}</h2>
      <HostImport client={client} orgId={org.id} properties={properties} onImported={data.reload} />
      <HostSync client={client} orgId={org.id} onSynced={data.reload} />
      <HostDigestToggle client={client} orgId={org.id} />
    </div>
  );
}
