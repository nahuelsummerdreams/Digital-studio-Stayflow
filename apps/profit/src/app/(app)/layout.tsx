"use client";

import type { ReactNode } from "react";
import { useT } from "@stayflow/i18n";
import { AppShell } from "@stayflow/shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <AppShell
      product="profit"
      nav={[
        { href: "/", label: t("nav.overview"), icon: "chart", description: t("navDesc.overview") },
        { href: "/entries", label: t("nav.entries"), icon: "list", description: t("navDesc.entries") },
        { href: "/fixed", label: t("nav.fixed"), icon: "repeat", description: t("navDesc.fixed") },
        { href: "/calculator", label: t("nav.calculator"), icon: "calculator", description: t("navDesc.calculator") },
        { href: "/properties", label: t("nav.properties"), icon: "building", description: t("navDesc.properties") },
      ]}
    >
      {children}
    </AppShell>
  );
}
