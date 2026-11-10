"use client";

import { useMemo, type ReactNode } from "react";
import { AccountProvider, createStayflowClient } from "@stayflow/auth";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function Providers({ children }: { children: ReactNode }) {
  const client = useMemo(() => (url && key ? createStayflowClient(url, key) : null), []);
  if (!client) {
    return (
      <main className="mx-auto max-w-md px-5 pt-14 text-sm">
        <h1 className="font-display text-2xl">Setup needed</h1>
        <p className="mt-3 text-black/60">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart.
        </p>
      </main>
    );
  }
  return <AccountProvider client={client}>{children}</AccountProvider>;
}
