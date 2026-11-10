import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PRODUCT_BRAND } from "@stayflow/ui";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
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
  themeColor: brand.accent,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
