"use client";

import { useAccount } from "@stayflow/auth";
import { ProfitOverview } from "@stayflow/module-profit";

export default function OverviewPage() {
  const { client, org, properties } = useAccount();
  if (!org) return null;
  return <ProfitOverview client={client} orgId={org.id} currency={org.currency} properties={properties} />;
}
