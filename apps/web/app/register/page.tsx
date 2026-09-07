import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthFormShell } from '@/features/auth/components/auth-form-shell';
import { RegisterForm } from '@/features/auth/components/register-form';
import { Button } from '@/shared/ui/button';

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
      <RegisterForm />
    </AuthFormShell>
  );
}
