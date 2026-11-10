import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DEFAULT_THEME, PRODUCT_BRAND, THEME_INIT_SCRIPT } from "@stayflow/ui";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { Providers } from "./providers";
import "./globals.css";

const brand = PRODUCT_BRAND.profit;

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
  manifest: "/manifest.webmanifest",
  applicationName: brand.name,
  appleWebApp: { capable: true, title: "Profit", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#060A13",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        {/* Applies the saved accent before first paint, so it never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
