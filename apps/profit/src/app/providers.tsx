"use client";

import type { ReactNode } from "react";
import { StayflowProviders } from "@stayflow/shell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StayflowProviders url={process.env.NEXT_PUBLIC_SUPABASE_URL} anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}>
      {children}
    </StayflowProviders>
  );
}
