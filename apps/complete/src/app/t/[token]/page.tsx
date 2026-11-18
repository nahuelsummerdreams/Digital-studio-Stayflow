"use client";

import { use, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { I18nProvider } from "@stayflow/i18n";
import { StaffJobs } from "@stayflow/module-operations";
import { FxProvider } from "@stayflow/ui";

/** The team's private page. No login: the link itself is the key, and the database only lets it touch that person's jobs. */
export default function StaffPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && anon ? createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  }, []);
  if (!client) return null;
  return (
    <I18nProvider>
      <FxProvider />
      <StaffJobs client={client} token={token} />
    </I18nProvider>
  );
}
