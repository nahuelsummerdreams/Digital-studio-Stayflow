"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SectionTab {
  href: string;
  label: string;
}

/** The sub-screens of one menu section (Finanzas, Operaciones), so every screen stays one tap away. */
export function SectionTabs({ tabs, label }: { tabs: SectionTab[]; label: string }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
      {tabs.map((tab) => {
        const on = tab.href === tabs[0]?.href ? path === tab.href : path.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={on ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${on ? "border-accent bg-accent/15 font-semibold text-accent" : "border-line bg-surface/50 text-muted hover:border-accent/50 hover:text-fg"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
