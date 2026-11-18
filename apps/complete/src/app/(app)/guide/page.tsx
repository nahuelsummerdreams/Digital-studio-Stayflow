"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { GuestHome } from "@stayflow/module-guest";

export default function HomePage() {
  const router = useRouter();
  const { client, org, allProperties } = useAccount();
  if (!org) return null;
  // The guide belongs to the establishment (hotel, hostel or rental), never to a room or a bed.
  const properties = allProperties.filter((p) => !p.parentId);
  return (
    <GuestHome
      client={client}
      orgId={org.id}
      properties={properties}
      onOpen={(id) => router.push(`/guide/${id}`)}
      onGoProperties={() => router.push("/properties")}
    />
  );
}
