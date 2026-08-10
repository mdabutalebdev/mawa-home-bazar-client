import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/redux";
import FloatingContact from "@/components/shared/FloatingContact";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { brandCssVariables, brandFaviconDataUri, brandFontsHref } from "@/config/brand";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mawahomebazarbd.com"),
  title: {
    default: "Mawa Homebazar BD — Your trusted online marketplace",
    template: "%s | Mawa Homebazar BD",
  },
  description: "Shop quality products at the best prices with Mawa Homebazar BD, your trusted online marketplace in Bangladesh.",
  keywords: ["mawa homebazar bd", "mawahomebazarbd", "online shopping", "ecommerce", "bangladesh", "marketplace", "best deals", "products"],
  applicationName: "Mawa Homebazar BD",
  alternates: { canonical: "/" },
  // The bag emblem alone — the full lockup's wordmark is illegible at 16–32px.
  // Both entries draw the same mark: the file for clients that want a URL, the
  // inline data URI (brand-colour tile) for those that skip SVG favicons.
  icons: {
    icon: [
      { url: '/logo-mark.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: brandFaviconDataUri() },
    ],
    apple: '/logo-mark.svg',
  },
  openGraph: {
    type: "website",
    siteName: "Mawa Homebazar BD",
    title: "Mawa Homebazar BD — Your trusted online marketplace",
    description: "Shop quality products at the best prices with Mawa Homebazar BD, your trusted online marketplace in Bangladesh.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mawa Homebazar BD — Your trusted online marketplace",
    description: "Shop quality products at the best prices with Mawa Homebazar BD, your trusted online marketplace in Bangladesh.",
  },
  robots: { index: true, follow: true },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Brand palette — generated from the single BRAND_PRIMARY constant in
            src/config/brand.ts and inlined server-side, so every
            var(--color-primary) resolves on the first paint (no colour flash). */}
        <style id="brand-palette" dangerouslySetInnerHTML={{ __html: brandCssVariables() }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Built from BRAND_FONT / BRAND_FONT_BANGLA in src/config/brand.ts, so
            changing the typeface there also changes what gets downloaded — no
            stale font request left behind. */}
        <link href={brandFontsHref()} rel="stylesheet" />
      </head>
      <body>
        <ReduxProvider>
          <ThemeProvider>
            {/* Bangla/English lives above the whole tree — the header toggle and
                every page below it must read the same choice. */}
            <LanguageProvider>
              <Toaster position="top-center" reverseOrder={false} />
              {children}
              <FloatingContact />
            </LanguageProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
