"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { HostDashboard, useHostData } from "@stayflow/module-host";

export default function DashboardPage() {
  const router = useRouter();
  const { client, org, properties } = useAccount();
  const data = useHostData(client, org?.id ?? "");
  if (!org) return null;
  return (
    <HostDashboard
      currency={org.currency}
      properties={properties}
      bookings={data.bookings}
      tasks={data.tasks}
      loading={data.loading}
      links={{ profit: process.env.NEXT_PUBLIC_PROFIT_URL || undefined, guest: process.env.NEXT_PUBLIC_GUEST_URL || undefined }}
      onGoBookings={() => router.push("/bookings")}
      onGoTasks={() => router.push("/tasks")}
      onGoProperties={() => router.push("/properties")}
    />
  );
}
