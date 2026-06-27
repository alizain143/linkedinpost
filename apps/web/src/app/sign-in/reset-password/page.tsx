import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthLayout } from "@/components/layout/auth-layout";

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
