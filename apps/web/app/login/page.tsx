import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { LoginForm } from '@/features/auth/components/login-form';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <AuthFormShell
      description="Sign in with your account. The browser keeps your session in secure httpOnly cookies."
      footer={
        <>
          Want to browse first?{' '}
          <Button asChild variant="link">
            <Link href="/products">View products</Link>
          </Button>
        </>
      }
      title="Sign in to continue shopping."
    >
      <Suspense
        fallback={
          <div className="space-y-5">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthFormShell>
  );
}
