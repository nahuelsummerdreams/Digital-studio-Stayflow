"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { HostBookings, useHostData } from "@stayflow/module-host";

function Screen() {
  const router = useRouter();
  const params = useSearchParams();
  const { client, org, properties } = useAccount();
  const data = useHostData();
  if (!org) return null;
  const propertyId = params.get("property") ?? undefined;
  const checkIn = params.get("in") ?? undefined;
  const prefill = propertyId || checkIn || params.get("new") ? { propertyId, checkIn, nonce: 1 } : undefined;
  return (
    <HostBookings
      client={client}
      orgId={org.id}
      currency={org.currency}
      properties={properties}
      prefill={prefill}
      data={data}
      onGoProperties={() => router.push("/properties")}
    />
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  );
}
