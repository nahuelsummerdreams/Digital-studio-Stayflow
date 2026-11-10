"use client";

import { useAccount } from "@stayflow/auth";
import { HostGuests, useHostData } from "@stayflow/module-host";

export default function GuestsPage() {
  const { org } = useAccount();
  const data = useHostData();
  if (!org) return null;
  return <HostGuests bookings={data.bookings} loading={data.loading} currency={org.currency} />;
}
