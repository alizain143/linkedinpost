import type { Metadata } from "next";
import {
  Inter,
  Newsreader,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { AppProviders } from "@/providers/app-providers";
import { rootMetadata } from "@/lib/seo/metadata";
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
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${jakarta.variable} ${newsreader.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-[#f6f7f9] text-slate-900">
          <AppProviders>
            <SoftwareApplicationJsonLd />
            {children}
          </AppProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
