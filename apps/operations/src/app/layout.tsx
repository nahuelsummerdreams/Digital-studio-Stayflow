import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DEFAULT_THEME, PRODUCT_BRAND, THEME_INIT_SCRIPT } from "@stayflow/ui";
import "@stayflow/ui/fonts";
import "@stayflow/ui/theme.css";
import "./globals.css";

const brand = PRODUCT_BRAND.operations;

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
  manifest: "/manifest.webmanifest",
  applicationName: brand.name,
  appleWebApp: { capable: true, title: "Operations", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#060A13", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
