import { Suspense } from "react";
import { Approvals } from "@/components/sections/app/approvals";

export default function ApprovalsPage() {
  return (
    <Suspense fallback={null}>
      <Approvals />
    </Suspense>
  );
}
