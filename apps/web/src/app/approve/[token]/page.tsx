import type { Metadata } from "next";
import { PublicApprovalPage } from "@/components/sections/public/PublicApprovalPage";

type ApprovePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Review post",
    robots: { index: false, follow: false },
  };
}

export default async function ApprovePage({ params }: ApprovePageProps) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-10 sm:px-6">
      <PublicApprovalPage token={token} />
    </main>
  );
}
