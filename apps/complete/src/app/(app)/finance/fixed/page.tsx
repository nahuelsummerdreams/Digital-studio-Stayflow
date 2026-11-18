"use client";

import { useAccount } from "@stayflow/auth";
import { ProfitFixed } from "@stayflow/module-profit";

export default function FixedPage() {
  const { client, org, properties } = useAccount();
  if (!org) return null;
  return <ProfitFixed client={client} orgId={org.id} currency={org.currency} properties={properties} />;
}
