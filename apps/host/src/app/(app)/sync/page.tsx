"use client";

import { useAccount } from "@stayflow/auth";
import { HostSync, useHostData } from "@stayflow/module-host";

export default function SyncPage() {
  const { client, org } = useAccount();
  const data = useHostData();
  if (!org) return null;
  return <HostSync client={client} orgId={org.id} onSynced={data.reload} />;
}
