import { AuthGate } from "@/components/auth/auth-gate";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { AuthLayout } from "@/components/layout/auth-layout";

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <AuthGate>
        <VerifyEmailForm />
      </AuthGate>
    </AuthLayout>
  );
}
