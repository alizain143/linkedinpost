import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import { HeaderAuth } from '../components/header-auth';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LinkedIn Post',
  description: 'LinkedIn post management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <header className="border-b border-zinc-200 px-6 py-4">
            <div className="mx-auto flex max-w-5xl items-center justify-between">
              <span className="text-sm font-semibold tracking-tight">
                LinkedIn Post
              </span>
              <HeaderAuth />
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
