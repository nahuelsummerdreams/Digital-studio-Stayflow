"use client";

import { useAccount } from "@stayflow/auth";
import { HostGuests, useHostData } from "@stayflow/module-host";

export default function GuestsPage() {
  const { client, org } = useAccount();
  const data = useHostData(client, org?.id ?? "");
  if (!org) return null;
  return <HostGuests bookings={data.bookings} loading={data.loading} currency={org.currency} />;
}
