"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "@stayflow/auth";
import { HostReception, useHostData } from "@stayflow/module-host";

export default function ReceptionPage() {
  const router = useRouter();
  const { client, org, properties, allProperties } = useAccount();
  const data = useHostData();
  const isRental = !org || org.lodgingType === "rental";
  useEffect(() => {
    if (org && isRental) router.replace("/");
  }, [org, isRental, router]);
  if (!org || isRental) return null;
  return (
    <HostReception
      client={client}
      currency={org.currency}
      type={org.lodgingType}
      allProperties={allProperties}
      units={properties}
      bookings={data.bookings}
      onChanged={data.reload}
    />
  );
}
