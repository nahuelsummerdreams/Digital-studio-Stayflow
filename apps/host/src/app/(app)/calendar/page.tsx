"use client";

import { useAccount } from "@stayflow/auth";
import { HostCalendar, useHostData } from "@stayflow/module-host";

export default function CalendarPage() {
  const { client, org, properties } = useAccount();
  const data = useHostData(client, org?.id ?? "");
  if (!org) return null;
  return <HostCalendar properties={properties} bookings={data.bookings} loading={data.loading} />;
}
