"use client";

import { useAccount } from "@stayflow/auth";
import { ProfitCalculator } from "@stayflow/module-profit";

export default function CalculatorPage() {
  const { client, org } = useAccount();
  if (!org) return null;
  return <ProfitCalculator client={client} orgId={org.id} currency={org.currency} />;
}
