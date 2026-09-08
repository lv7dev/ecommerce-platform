import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminLoginForm } from '@/features/auth/components/admin-login-form';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { Skeleton } from '@/shared/ui/skeleton';

export const metadata: Metadata = {
  title: 'Admin sign in',
};

export default function LoginPage() {
  return (
    <AuthFormShell
      description="Sign in with an internal account to access the admin console."
      title="Admin sign in"
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
        <AdminLoginForm />
      </Suspense>
    </AuthFormShell>
  );
}
