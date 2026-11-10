"use client";

import { useMemo, type ReactNode } from "react";
import { AccountProvider, createStayflowClient } from "@stayflow/auth";
import { I18nProvider, useT } from "@stayflow/i18n";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function MissingConfig() {
  const t = useT();
  return (
    <main className="mx-auto max-w-md px-5 pt-14 text-sm">
      <h1 className="font-display text-2xl">{t("common.setupTitle")}</h1>
      <p className="mt-3 text-muted">{t("common.setupBody")}</p>
    </main>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const client = useMemo(() => (url && key ? createStayflowClient(url, key) : null), []);
  return (
    <I18nProvider>
      {client ? <AccountProvider client={client}>{children}</AccountProvider> : <MissingConfig />}
    </I18nProvider>
  );
}
