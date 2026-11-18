"use client";

import type { ReactNode } from "react";
import { useT } from "@stayflow/i18n";
import { SectionTabs } from "@/components/SectionTabs";

export default function OperationsLayout({ children }: { children: ReactNode }) {
  const t = useT();
  const tabs = [
    { href: "/operations", label: t("complete.tabs.opsToday") },
    { href: "/operations/jobs", label: t("complete.tabs.opsJobs") },
    { href: "/operations/maintenance", label: t("complete.tabs.opsMaintenance") },
    { href: "/operations/checklists", label: t("complete.tabs.opsChecklists") },
    { href: "/operations/team", label: t("complete.tabs.opsStaff") },
  ];
  return (
    <>
      <SectionTabs tabs={tabs} label={t("complete.tabs.opsLabel")} />
      {children}
    </>
  );
}
