"use client";

import { useT } from "@stayflow/i18n";
import { DigitalStudioLogo } from "./DigitalStudioLogo";

/** "A product by Digital Studio" endorsement. The parent brand is shown as backing, never as the product. */
export function StudioSeal({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="text-xs uppercase tracking-[0.2em] text-muted">{t("common.productBy")}</span>
      <DigitalStudioLogo className="h-7 w-auto text-fg" />
    </div>
  );
}
