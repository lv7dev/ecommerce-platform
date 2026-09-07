import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { VerifyEmailForm } from '@/features/auth/components/verify-email-form';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

export const metadata: Metadata = {
  title: 'Verify email',
};

export default function VerifyEmailPage() {
  return (
    <AuthFormShell
      description="Confirm your email address with the verification token."
      footer={
        <>
          Already verified?{' '}
          <Button asChild variant="link">
            <Link href="/account">Go to account</Link>
          </Button>
        </>
      }
      title="Verify your email address."
    >
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <VerifyEmailForm />
      </Suspense>
    </AuthFormShell>
  );
}
