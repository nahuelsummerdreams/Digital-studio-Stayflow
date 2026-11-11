"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { OpsToday, useOpsData } from "@stayflow/module-operations";

export default function TodayPage() {
  const router = useRouter();
  const { client, org, properties, session } = useAccount();
  const data = useOpsData();
  if (!org) return null;
  const meta = session?.user.user_metadata as { full_name?: string } | undefined;
  const userName = (meta?.full_name?.trim() || session?.user.email?.split("@")[0] || org.name).split(" ")[0] ?? org.name;
  return <OpsToday client={client} properties={properties} jobs={data.jobs} staff={data.staff} loading={data.loading} userName={userName} reload={data.reload} onNewJob={() => router.push("/jobs?new=1")} />;
}
