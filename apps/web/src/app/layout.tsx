import type { Metadata } from "next";
import {
  Inter,
  Newsreader,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GaPageView } from "@/components/analytics/ga-page-view";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
} from "@/components/seo/json-ld";
import { AppProviders } from "@/providers/app-providers";
import { rootMetadata } from "@/lib/seo/metadata";
import {
  DASHBOARD_ROUTE,
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
} from "@/lib/auth/routes";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl={SIGN_IN_ROUTE}
      signUpUrl={SIGN_UP_ROUTE}
      signInFallbackRedirectUrl={DASHBOARD_ROUTE}
      signUpFallbackRedirectUrl={DASHBOARD_ROUTE}
      afterSignOutUrl={SIGN_IN_ROUTE}
      appearance={clerkAppearance}
    >
      <html
        lang="en"
        className={`${inter.variable} ${jakarta.variable} ${newsreader.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <GoogleAnalytics />
        </head>
        <body className="min-h-full bg-[#f6f7f9] text-slate-900">
          <AppProviders>
            <OrganizationJsonLd />
            <WebSiteJsonLd />
            <SoftwareApplicationJsonLd />
            {children}
            <GaPageView />
          </AppProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
