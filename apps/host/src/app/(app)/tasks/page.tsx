"use client";

import { useAccount } from "@stayflow/auth";
import { HostTasks, useHostData } from "@stayflow/module-host";

export default function TasksPage() {
  const { client, org, properties } = useAccount();
  const data = useHostData(client, org?.id ?? "");
  if (!org) return null;
  return <HostTasks client={client} orgId={org.id} properties={properties} tasks={data.tasks} loading={data.loading} reload={data.reload} />;
}
