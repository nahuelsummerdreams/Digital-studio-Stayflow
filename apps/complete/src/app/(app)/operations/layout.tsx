import type { ReactNode } from "react";
import { SectionTabs } from "@/components/SectionTabs";

const TABS = [
  { href: "/operations", label: "Hoy" },
  { href: "/operations/jobs", label: "Trabajos" },
  { href: "/operations/maintenance", label: "Mantenimiento" },
  { href: "/operations/checklists", label: "Listas de control" },
  { href: "/operations/team", label: "Personal" },
];

export default function OperationsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SectionTabs tabs={TABS} label="Operaciones" />
      {children}
    </>
  );
}
