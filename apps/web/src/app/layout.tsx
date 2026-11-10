import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@stayflow/ui";
import { t } from "@/lib/t";
import "@stayflow/ui/fonts";
import "@stayflow/ui/theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: t("landing.meta.title"),
  description: t("landing.meta.description"),
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: t("landing.meta.title"),
    description: t("landing.meta.description"),
    locale: "es_ES",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#060A13", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        {/* Applies the saved accent before first paint, so it never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
