"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { GuestHome } from "@stayflow/module-guest";

export default function HomePage() {
  const router = useRouter();
  const { client, org, properties } = useAccount();
  if (!org) return null;
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
