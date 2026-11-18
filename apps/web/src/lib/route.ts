"use client";

import { usePathname } from "next/navigation";

/** The new single-product landing (/complete) has its own call to action: the shop widgets of the old home stay out of its way. */
export function useIsCompleteLanding(): boolean {
  return (usePathname() ?? "").startsWith("/complete");
}
