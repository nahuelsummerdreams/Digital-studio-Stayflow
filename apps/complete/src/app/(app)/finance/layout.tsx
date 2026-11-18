import type { ReactNode } from "react";
import { SectionTabs } from "@/components/SectionTabs";

const TABS = [
  { href: "/finance", label: "Resumen" },
  { href: "/finance/entries", label: "Ingresos y gastos" },
  { href: "/finance/fixed", label: "Gastos fijos" },
  { href: "/finance/calculator", label: "Calculadora" },
];

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SectionTabs tabs={TABS} label="Finanzas" />
      {children}
    </>
  );
}
