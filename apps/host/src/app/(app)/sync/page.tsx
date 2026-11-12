"use client";

import { useAccount } from "@stayflow/auth";
import { HostImport, HostSync, useHostData } from "@stayflow/module-host";

export default function SyncPage() {
  const { client, org, properties } = useAccount();
  const data = useHostData();
  if (!org) return null;
  return (
    <div className="space-y-8">
      <HostImport client={client} orgId={org.id} properties={properties} onImported={data.reload} />
      <HostSync client={client} orgId={org.id} onSynced={data.reload} />
    </div>
  );
}
