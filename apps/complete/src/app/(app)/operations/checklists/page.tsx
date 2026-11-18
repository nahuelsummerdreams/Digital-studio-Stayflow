"use client";

import { useAccount } from "@stayflow/auth";
import { OpsChecklists, useOpsData } from "@stayflow/module-operations";

export default function ChecklistsPage() {
  const { client, org, properties } = useAccount();
  const data = useOpsData();
  if (!org) return null;
  return <OpsChecklists client={client} orgId={org.id} properties={properties} checklists={data.checklists} reload={data.reload} />;
}
