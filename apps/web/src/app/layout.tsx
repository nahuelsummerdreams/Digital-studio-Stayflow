import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@stayflow/ui";
import { t } from "@/lib/t";
import "@stayflow/ui/fonts";
import "@stayflow/ui/theme.css";
import "./globals.css";
import "./boxes.css";
import { Assistant } from "@/components/assistant";
import { CartDrawer, CartProvider } from "@/components/cart";
import { CartBar } from "@/components/client";
import { ConsentBanner } from "@/components/consent";
import { Celebration, CursorGlow, ScrollProgress } from "@/components/effects";
import { PromoBar } from "@/components/promo";
import { MessagesProvider } from "@/i18n/client";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://stayflow-web-livid.vercel.app"),
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
      <body className="font-sans">
        <MessagesProvider>
          <CartProvider>
            <PromoBar />
            <ScrollProgress />
            <CursorGlow />
            {children}
            <CartDrawer />
            <CartBar />
            <Assistant />
            <Celebration />
            <ConsentBanner />
          </CartProvider>
        </MessagesProvider>
      </body>
    </html>
  );
}
