"use client";

import { useAccount } from "@stayflow/auth";
import { OpsTeam, useOpsData } from "@stayflow/module-operations";

export default function TeamPage() {
  const { client, org } = useAccount();
  const data = useOpsData();
  if (!org) return null;
  return <OpsTeam client={client} orgId={org.id} staff={data.staff} jobs={data.jobs} reload={data.reload} />;
}
