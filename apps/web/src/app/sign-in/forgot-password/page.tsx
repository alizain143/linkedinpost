import { AuthGate } from "@/components/auth/auth-gate";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthLayout } from "@/components/layout/auth-layout";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthGate>
        <ForgotPasswordForm />
      </AuthGate>
    </AuthLayout>
  );
}
