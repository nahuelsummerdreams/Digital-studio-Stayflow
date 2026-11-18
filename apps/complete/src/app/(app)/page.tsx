"use client";

import { useRouter } from "next/navigation";
import { CategoryBar, useAccount } from "@stayflow/auth";
import { HostCategoryBand, HostDigestToggle, HostGettingStarted, useHostData } from "@stayflow/module-host";
import { CompleteHome } from "@/components/CompleteHome";

export default function HomePage() {
  const router = useRouter();
  const { client, org, properties, session, refresh } = useAccount();
  const data = useHostData();
  if (!org) return null;
  const meta = session?.user.user_metadata as { full_name?: string } | undefined;
  const userName = (meta?.full_name?.trim() || session?.user.email?.split("@")[0] || org.name).split(" ")[0] ?? org.name;
  const gs = (
    <HostGettingStarted lodgingType={org.lodgingType} allowDemo={org.lodgingType === "rental" || org.lodgingType === "cabins"} client={client} orgId={org.id} properties={properties} bookings={data.bookings} onGo={(href) => router.push(href)} onChanged={async () => { await refresh(); await data.reload(); }} />
  );
  // First visit: the guided start (create a property, try with sample data). Once there is something to manage, the owner's home takes over.
  if (properties.length === 0) return <div className="space-y-6"><CategoryBar />{gs}</div>;
  return (
    <div className="space-y-6">
      <CategoryBar />
      {gs}
      <HostCategoryBand lodgingType={org.lodgingType} currency={org.currency} units={properties} bookings={data.bookings} onAdd={() => router.push("/properties")} />
      <CompleteHome client={client} orgId={org.id} currency={org.currency} userName={userName} properties={properties} />
      <HostDigestToggle client={client} orgId={org.id} />
    </div>
  );
}
