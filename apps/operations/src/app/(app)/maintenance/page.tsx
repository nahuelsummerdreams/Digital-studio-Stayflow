"use client";

import { useAccount } from "@stayflow/auth";
import { OpsMaintenance, useOpsData } from "@stayflow/module-operations";

export default function MaintenancePage() {
  const { client, org, properties } = useAccount();
  const data = useOpsData();
  if (!org) return null;
  return <OpsMaintenance client={client} orgId={org.id} properties={properties} recurring={data.recurring} reload={data.reload} />;
}
