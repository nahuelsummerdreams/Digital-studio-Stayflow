"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { HostCalendar, useHostData } from "@stayflow/module-host";

export default function CalendarPage() {
  const router = useRouter();
  const { org, properties } = useAccount();
  const data = useHostData();
  if (!org) return null;
  return (
    <HostCalendar
      currency={org.currency}
      properties={properties}
      bookings={data.bookings}
      loading={data.loading}
      onCreateBooking={(propertyId, checkIn) => router.push(`/bookings?property=${propertyId}&in=${checkIn}`)}
      onOpenBookings={() => router.push("/bookings")}
    />
  );
}
