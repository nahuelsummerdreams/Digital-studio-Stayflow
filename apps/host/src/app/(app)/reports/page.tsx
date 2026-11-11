"use client";

import { useAccount } from "@stayflow/auth";
import { HostReports, useHostData } from "@stayflow/module-host";

export default function ReportsPage() {
  const { org, properties } = useAccount();
  const data = useHostData();
  if (!org) return null;
  return <HostReports currency={org.currency} orgName={org.name} properties={properties} bookings={data.bookings} loading={data.loading} />;
}
