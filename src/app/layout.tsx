import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/redux";
import FloatingContact from "@/components/shared/FloatingContact";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { brandCssVariables, brandFontsHref } from "@/config/brand";

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
  // The browser-tab icon and iOS home-screen icon come from the Safwan logo
  // via the Next.js file convention — `src/app/icon.jpeg` and
  // `src/app/apple-icon.jpeg`. Next.js serves them with content-hashed URLs,
  // which sidesteps the aggressive favicon caching that made the metadata-URL
  // approach unreliable. No `icons` field is needed here as a result.
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
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        {/* The app ships its own Bangla/English switcher, so browser auto-
            translation is unwanted — and worse, Google Translate rewrites text
            nodes underneath React, which then crashes on its next render with
            "Failed to execute 'insertBefore'". These two lines tell the browser
            not to translate the page, removing that whole class of crash. */}
        <meta name="google" content="notranslate" />
        {/* ── DOM-mutation crash guard ──
            The notranslate hints above stop Chrome's *built-in* translator, but
            third-party extensions (Google Translate add-ons, Grammarly, ad
            blockers, AI assistants, password managers) ignore them and still
            rewrite the DOM underneath React. On its next render React calls
            removeChild / insertBefore on a node the extension already moved,
            which throws a NotFoundError that white-screens the whole app
            ("Failed to execute 'removeChild' on 'Node': The node to be removed
            is not a child of this node."). These two guards make those calls a
            graceful no-op when the parent link is broken, so a misbehaving
            extension can never crash the page. It is an inline <head> script on
            purpose: it must patch the prototype *before* React hydrates, and the
            whole thing is wrapped in try/catch so it can never break the page. */}
        <script
            dangerouslySetInnerHTML={{
                __html:
                    '(function(){try{if(typeof Node!=="function"||!Node.prototype)return;var P=Node.prototype;var r=P.removeChild;P.removeChild=function(c){if(c&&c.parentNode!==this)return c;return r.apply(this,arguments);};var i=P.insertBefore;P.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this)return n;return i.apply(this,arguments);};}catch(e){}})();',
            }}
        />
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
      {/* suppressHydrationWarning: browser extensions (ColorZilla adds
          `cz-shortcut-listen`, Grammarly, etc.) inject attributes onto <body>
          before React hydrates, which otherwise trips a harmless hydration
          mismatch warning. This silences only <body>'s own attribute diff. */}
      <body suppressHydrationWarning>
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
