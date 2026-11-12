"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { hasProductAccess, type License, type ProductKey } from "@stayflow/licensing";
import { fetchLicenses, fetchMyRole, fetchOrgModules, fetchOrganizations, fetchProperties, reservableProperties, type OrgRole, type Organization, type Property } from "./api";

interface AccountState {
  client: SupabaseClient;
  /** True until the session and the account data have been resolved once. */
  loading: boolean;
  session: Session | null;
  org: Organization | null;
  /** Role of the signed-in user in this business (owner, admin, member, viewer). */
  role: OrgRole | null;
  licenses: License[];
  /** Modules this organization has (follow its category). Empty until loaded: the menu then shows everything. */
  modules: string[];
  /** What can be reserved: properties (rental), rooms (hotel) or beds (hostel). Every app works with this flat list. */
  properties: Property[];
  /** Everything, including establishments that only hold rooms or beds. Used to manage the structure. */
  allProperties: Property[];
  error: string | null;
  can: (product: ProductKey) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  /** True when the person arrived from a "forgot my password" email and must choose a new one. */
  recovery: boolean;
  endRecovery: () => void;
}

const AccountContext = createContext<AccountState | null>(null);

export function AccountProvider({ client, children }: { client: SupabaseClient; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [accountReady, setAccountReady] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [role, setRole] = useState<OrgRole | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [allProperties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    let alive = true;
    client.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setSessionReady(true);
    });
    // Only store the session here: calling Supabase inside this callback can deadlock the client.
    const { data: sub } = client.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
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
      setRole(null);
      setLicenses([]);
      setModules([]);
      setProperties([]);
      return;
    }
    try {
      setError(null);
      const first = (await fetchOrganizations(client))[0] ?? null;
      setOrg(first);
      if (first) {
        const [lic, props, mods, myRole] = await Promise.all([fetchLicenses(client, first.id), fetchProperties(client, first.id), fetchOrgModules(client, first.id).catch(() => [] as string[]), fetchMyRole(client, first.id, userId).catch(() => null)]);
        setRole(myRole);
        setLicenses(lic);
        setModules(mods);
        setProperties(props);
      } else {
        setLicenses([]);
        setModules([]);
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

  const properties = useMemo(() => reservableProperties(allProperties, org?.lodgingType ?? "rental"), [allProperties, org?.lodgingType]);

  const value = useMemo<AccountState>(
    () => ({
      client,
      loading: !sessionReady || !accountReady,
      session,
      org,
      role,
      licenses,
      modules,
      properties,
      allProperties,
      error,
      can: (product) => hasProductAccess(licenses, product),
      refresh: load,
      signOut: async () => {
        await client.auth.signOut();
      },
      recovery,
      endRecovery: () => setRecovery(false),
    }),
    [client, sessionReady, accountReady, session, org, role, licenses, modules, properties, allProperties, error, load, recovery],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountState {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside <AccountProvider>");
  return ctx;
}
