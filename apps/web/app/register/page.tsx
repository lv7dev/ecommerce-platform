import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { RegisterForm } from '@/features/auth/components/register-form';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

export const metadata: Metadata = {
  title: 'Create account',
};

export default function RegisterPage() {
  return (
    <AuthFormShell
      description="Create a customer account for checkout, order history, and future account features."
      footer={
        <>
          Want to browse first?{' '}
          <Button asChild variant="link">
            <Link href="/products">View products</Link>
          </Button>
        </>
      }
      title="Create your storefront account."
    >
      <Suspense
        fallback={
          <div className="space-y-5">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthFormShell>
  );
}
