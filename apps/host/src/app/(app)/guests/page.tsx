"use client";

import { useAccount } from "@stayflow/auth";
import { HostGuests, useHostData } from "@stayflow/module-host";

export default function GuestsPage() {
  const { client, org, properties } = useAccount();
  const data = useHostData();
  if (!org) return null;
  return <HostGuests client={client} orgId={org.id} bookings={data.bookings} properties={properties} loading={data.loading} currency={org.currency} />;
}
