import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

export const metadata: Metadata = {
  title: 'Reset password',
};

export default function ResetPasswordPage() {
  return (
    <AuthFormShell
      description="Set a new password with the reset token from your email."
      footer={
        <>
          Need another link?{' '}
          <Button asChild variant="link">
            <Link href="/forgot-password">Request reset</Link>
          </Button>
        </>
      }
      title="Choose a new password."
    >
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthFormShell>
  );
}
