"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { hasProductAccess, type License, type ProductKey } from "@stayflow/licensing";
import { fetchLicenses, fetchOrganizations, fetchProperties, type Organization, type Property } from "./api";

interface AccountState {
  client: SupabaseClient;
  /** True until the session and the account data have been resolved once. */
  loading: boolean;
  session: Session | null;
  org: Organization | null;
  licenses: License[];
  properties: Property[];
  error: string | null;
  can: (product: ProductKey) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AccountContext = createContext<AccountState | null>(null);

export function AccountProvider({ client, children }: { client: SupabaseClient; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [accountReady, setAccountReady] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    client.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setSessionReady(true);
    });
    // Only store the session here: calling Supabase inside this callback can deadlock the client.
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  const userId = session?.user.id ?? null;

  const load = useCallback(async () => {
    if (!userId) {
      setOrg(null);
      setLicenses([]);
      setProperties([]);
      return;
    }
    try {
      setError(null);
      const first = (await fetchOrganizations(client))[0] ?? null;
      setOrg(first);
      if (first) {
        const [lic, props] = await Promise.all([fetchLicenses(client, first.id), fetchProperties(client, first.id)]);
        setLicenses(lic);
        setProperties(props);
      } else {
        setLicenses([]);
        setProperties([]);
      }
    } catch {
      setError("We could not load your account. Check your connection and try again.");
    }
  }, [client, userId]);

  useEffect(() => {
    if (!sessionReady) return;
    let alive = true;
    setAccountReady(false);
    load().finally(() => {
      if (alive) setAccountReady(true);
    });
    return () => {
      alive = false;
    };
  }, [sessionReady, load]);

  const value = useMemo<AccountState>(
    () => ({
      client,
      loading: !sessionReady || !accountReady,
      session,
      org,
      licenses,
      properties,
      error,
      can: (product) => hasProductAccess(licenses, product),
      refresh: load,
      signOut: async () => {
        await client.auth.signOut();
      },
    }),
    [client, sessionReady, accountReady, session, org, licenses, properties, error, load],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountState {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside <AccountProvider>");
  return ctx;
}
