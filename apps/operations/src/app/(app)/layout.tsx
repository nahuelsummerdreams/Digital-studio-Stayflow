"use client";

import { useMemo, type ReactNode } from "react";
import { useAccount } from "@stayflow/auth";
import { useT } from "@stayflow/i18n";
import { OpsDataProvider, groupJobs, localToday, useOpsData } from "@stayflow/module-operations";
import { AppShell, StayflowProviders, type ShellAlert } from "@stayflow/shell";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

function Frame({ children }: { children: ReactNode }) {
  const t = useT();
  const { properties } = useAccount();
  const { jobs } = useOpsData();
  const today = localToday();
  const g = useMemo(() => groupJobs(jobs, today), [jobs, today]);

  const alerts = useMemo<ShellAlert[]>(
    () => [
      ...g.overdue.slice(0, 6).map((j) => ({ id: `late-${j.id}`, tone: "danger" as const, title: j.title, detail: properties.find((p) => p.id === j.propertyId)?.name ?? "", href: "/jobs" })),
      ...(g.today.length > 0 ? [{ id: "today", tone: "accent" as const, title: t("ops.summary", { today: g.today.length, late: g.overdue.length }), detail: "", href: "/" }] : []),
    ],
    [g, properties, t],
  );

  return (
    <AppShell
      product="operations"
      quickAction={{ label: t("ops.newJob"), href: "/jobs?new=1" }}
      alerts={alerts}
      plansUrl={process.env.NEXT_PUBLIC_WEB_URL ? `${process.env.NEXT_PUBLIC_WEB_URL}#precios` : undefined}
      nav={[
        { href: "/", label: t("opsnav.today"), icon: "dashboard", description: t("opsNavDesc.today"), group: t("navGroup.control"), ownHeading: true, badge: g.overdue.length + g.today.length },
        { href: "/jobs", label: t("opsnav.jobs"), icon: "tasks", description: t("opsNavDesc.jobs") },
        { href: "/checklists", label: t("opsnav.checklists"), icon: "list", description: t("opsNavDesc.checklists"), group: t("navGroup.manage") },
        { href: "/team", label: t("opsnav.team"), icon: "users", description: t("opsNavDesc.team") },
        { href: "/maintenance", label: t("opsnav.maintenance"), icon: "repeat", description: t("opsNavDesc.maintenance") },
        { href: "/properties", label: t("opsnav.properties"), icon: "building", description: t("opsNavDesc.properties"), badge: properties.length },
      ]}
    >
      {children}
    </AppShell>
  );
}

function WithData({ children }: { children: ReactNode }) {
  const { client, org, can } = useAccount();
  return (
    <OpsDataProvider client={client} orgId={org?.id ?? ""} enabled={can("operations")}>
      <Frame>{children}</Frame>
    </OpsDataProvider>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <StayflowProviders url={process.env.NEXT_PUBLIC_SUPABASE_URL} anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}>
      <WithData>{children}</WithData>
      <RegisterServiceWorker />
    </StayflowProviders>
  );
}
