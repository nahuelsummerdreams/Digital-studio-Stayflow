import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DEFAULT_THEME, PRODUCT_BRAND, THEME_INIT_SCRIPT } from "@stayflow/ui";
import "@stayflow/ui/fonts";
import "@stayflow/ui/theme.css";
import "./globals.css";

const brand = PRODUCT_BRAND.marketing;

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
  icons: { icon: "/icon.svg" },
  robots: { index: false, follow: false },
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
