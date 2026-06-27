import { AuthGate } from "@/components/auth/auth-gate";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthLayout } from "@/components/layout/auth-layout";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <AuthGate>
        <SignUpForm />
      </AuthGate>
    </AuthLayout>
  );
}
