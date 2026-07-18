import type { Metadata } from "next";
import { AppShellClient } from "@/components/app/app-shell-client";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "App",
  path: "/app",
  noIndex: true,
});

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellClient>{children}</AppShellClient>;
}
