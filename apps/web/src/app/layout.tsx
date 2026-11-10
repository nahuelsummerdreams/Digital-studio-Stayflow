import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@stayflow/ui/fonts";
import "@stayflow/ui/theme.css";
import "./globals.css";
import "./site.css";
import { CartProvider } from "@/components/cart";
import { CartUi } from "@/components/sections";
import { MessagesProvider } from "@/i18n/client";
import { getMessages } from "@/i18n";

const m = getMessages();
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stayflow-web-livid.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: m.meta.title, template: "%s" },
  description: m.meta.description,
  icons: { icon: "/icon.svg" },
  alternates: { canonical: "/", languages: { en: "/" } }, // add es / pt here when those languages open
  openGraph: { title: m.meta.title, description: m.meta.description, locale: "en_US", type: "website", siteName: "Stayflow" },
  twitter: { card: "summary_large_image", title: m.meta.title, description: m.meta.description },
};

export const viewport: Viewport = { themeColor: "#F7F9F8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="site">
      <body className="font-sans">
        <MessagesProvider>
          <CartProvider>
            {children}
            <CartUi />
          </CartProvider>
        </MessagesProvider>
      </body>
    </html>
  );
}
