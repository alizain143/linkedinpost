import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to linkedinpost.ai to generate and manage LinkedIn content.",
  path: "/sign-in",
  noIndex: true,
});

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
