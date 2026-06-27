import { AuthGate } from "@/components/auth/auth-gate";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthLayout } from "@/components/layout/auth-layout";

export default function SignInPage() {
  return (
    <AuthLayout>
      <AuthGate>
        <SignInForm />
      </AuthGate>
    </AuthLayout>
  );
}
