"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { HostDashboard, HostDigestToggle, HostGettingStarted, useHostData } from "@stayflow/module-host";

export default function DashboardPage() {
  const router = useRouter();
  const { client, org, properties, session, refresh } = useAccount();
  const data = useHostData();
  if (!org) return null;
  const meta = session?.user.user_metadata as { full_name?: string } | undefined;
  const userName = meta?.full_name?.trim() || session?.user.email?.split("@")[0] || org.name;
  const gs = (
    <HostGettingStarted allowDemo={org.lodgingType === "rental" || org.lodgingType === "cabins"} client={client} orgId={org.id} properties={properties} bookings={data.bookings} onGo={(href) => router.push(href)} onChanged={async () => { await refresh(); await data.reload(); }} />
  );
  if (properties.length === 0) return gs;
  return (
    <div className="space-y-6">
    {gs}
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
    <HostDigestToggle client={client} orgId={org.id} />
    </div>
  );
}
