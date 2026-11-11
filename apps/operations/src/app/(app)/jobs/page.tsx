"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { OpsJobs, useOpsData } from "@stayflow/module-operations";

function Screen() {
  const params = useSearchParams();
  const { client, org, properties } = useAccount();
  const data = useOpsData();
  if (!org) return null;
  return <OpsJobs client={client} orgId={org.id} properties={properties} jobs={data.jobs} staff={data.staff} checklists={data.checklists} loading={data.loading} reload={data.reload} focusNonce={params.get("new") ? 1 : 0} />;
}

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  );
}
