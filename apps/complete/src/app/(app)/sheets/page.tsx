"use client";

import { useAccount } from "@stayflow/auth";
import { HostPropertyDetails } from "@stayflow/module-host";
import { useT } from "@stayflow/i18n";

export default function SheetsPage() {
  const { client, org, properties } = useAccount();
  const t = useT();
  if (!org) return null;
  return <HostPropertyDetails client={client} orgId={org.id} properties={properties} unitsLabel={t(`unit.${org.lodgingType}.many`)} />;
}
