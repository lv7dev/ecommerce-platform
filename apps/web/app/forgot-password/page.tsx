import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';
import { Button } from '@/shared/ui/button';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return (
    <AuthFormShell
      description="Request a password reset link for your storefront account."
      footer={
        <>
          Remembered your password?{' '}
          <Button asChild variant="link">
            <Link href="/login">Sign in</Link>
          </Button>
        </>
      }
      title="Reset access to your account."
    >
      <ForgotPasswordForm />
    </AuthFormShell>
  );
}
