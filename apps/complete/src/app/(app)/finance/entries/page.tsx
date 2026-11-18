"use client";

import { useAccount } from "@stayflow/auth";
import { ProfitEntries } from "@stayflow/module-profit";

export default function EntriesPage() {
  const { client, org, properties } = useAccount();
  if (!org) return null;
  return <ProfitEntries client={client} orgId={org.id} currency={org.currency} properties={properties} />;
}
