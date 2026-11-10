"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { HostDashboard, useHostData } from "@stayflow/module-host";

export default function DashboardPage() {
  const router = useRouter();
  const { org, properties, session } = useAccount();
  const data = useHostData();
  if (!org) return null;
  const meta = session?.user.user_metadata as { full_name?: string } | undefined;
  const userName = meta?.full_name?.trim() || session?.user.email?.split("@")[0] || org.name;
  return (
    <HostDashboard
      currency={org.currency}
      userName={userName}
      properties={properties}
      bookings={data.bookings}
      tasks={data.tasks}
      loading={data.loading}
      links={{ profit: process.env.NEXT_PUBLIC_PROFIT_URL || undefined, guest: process.env.NEXT_PUBLIC_GUEST_URL || undefined }}
      onGoBookings={() => router.push("/bookings")}
      onGoCalendar={() => router.push("/calendar")}
      onGoTasks={() => router.push("/tasks")}
      onGoProperties={() => router.push("/properties")}
      onNewBooking={() => router.push("/bookings?new=1")}
    />
  );
}
