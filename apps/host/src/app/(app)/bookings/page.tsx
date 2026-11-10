"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { HostBookings, useHostData } from "@stayflow/module-host";

export default function BookingsPage() {
  const router = useRouter();
  const { client, org, properties } = useAccount();
  const data = useHostData(client, org?.id ?? "");
  if (!org) return null;
  return (
    <HostBookings
      client={client}
      orgId={org.id}
      currency={org.currency}
      properties={properties}
      data={data}
      onGoProperties={() => router.push("/properties")}
    />
  );
}
