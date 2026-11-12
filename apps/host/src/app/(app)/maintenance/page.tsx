"use client";

import { useAccount } from "@stayflow/auth";
import { HostMaintenance } from "@stayflow/module-host";

export default function MaintenancePage() {
  const { client, org, properties } = useAccount();
  if (!org) return null;
  return <HostMaintenance client={client} orgId={org.id} currency={org.currency} properties={properties} />;
}
