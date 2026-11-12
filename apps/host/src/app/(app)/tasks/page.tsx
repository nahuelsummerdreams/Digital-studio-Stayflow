"use client";

import { useAccount } from "@stayflow/auth";
import { HostTasks, useHostData } from "@stayflow/module-host";

export default function TasksPage() {
  const { client, org, properties, session } = useAccount();
  const data = useHostData();
  if (!org) return null;
  return <HostTasks client={client} orgId={org.id} properties={properties} tasks={data.tasks} loading={data.loading} reload={data.reload} userId={session?.user.id} />;
}
