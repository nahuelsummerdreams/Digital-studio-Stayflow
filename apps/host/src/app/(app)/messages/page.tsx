"use client";

import { useAccount } from "@stayflow/auth";
import { HostMessages, useHostData } from "@stayflow/module-host";

export default function MessagesPage() {
  const { client, org, properties } = useAccount();
  const data = useHostData();
  if (!org) return null;
  return <HostMessages client={client} orgId={org.id} properties={properties} bookings={data.bookings} guestBase={process.env.NEXT_PUBLIC_GUEST_URL} />;
}
