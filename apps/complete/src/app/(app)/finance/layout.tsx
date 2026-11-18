"use client";

import type { ReactNode } from "react";
import { useT } from "@stayflow/i18n";
import { SectionTabs } from "@/components/SectionTabs";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const t = useT();
  const tabs = [
    { href: "/finance", label: t("complete.tabs.financeOverview") },
    { href: "/finance/entries", label: t("complete.tabs.financeEntries") },
    { href: "/finance/fixed", label: t("complete.tabs.financeFixed") },
    { href: "/finance/calculator", label: t("complete.tabs.financeCalculator") },
  ];
  return (
    <>
      <SectionTabs tabs={tabs} label={t("complete.tabs.financeLabel")} />
      {children}
    </>
  );
}
