import type { Metadata } from 'next';
import Link from 'next/link';
import { MailCheck, MailWarning, UserCircle } from 'lucide-react';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { RequestEmailVerificationButton } from '@/features/auth/components/request-email-verification-button';
import { requireAuth } from '@/features/auth/server/require-auth';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

export const metadata: Metadata = {
  title: 'Account',
};

export default async function AccountPage() {
  const user = await requireAuth();
  const isEmailVerified = Boolean(user.emailVerifiedAt);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Button asChild variant="outline">
          <Link href="/products">Back to products</Link>
        </Button>
        <LogoutButton />
      </div>
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="w-fit" variant="secondary">
              Signed in
            </Badge>
            <Badge className="w-fit gap-1.5" variant={isEmailVerified ? 'success' : 'warning'}>
              {isEmailVerified ? (
                <MailCheck className="size-3.5" />
              ) : (
                <MailWarning className="size-3.5" />
              )}
              {isEmailVerified ? 'Email verified' : 'Email not verified'}
            </Badge>
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-foreground">
            Welcome{user.name ? `, ${user.name}` : ''}.
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            This page uses the cookie-backed server auth guard. Future account, order history, and
            checkout pages can follow the same pattern.
          </p>
        </div>
        <dl className="rounded-md border bg-card p-5 text-sm shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-foreground">
            <UserCircle className="size-5" />
            <dt className="font-medium">Session profile</dt>
          </div>
          <div className="space-y-4">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-1 font-medium text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1 font-medium text-foreground">{user.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Roles</dt>
              <dd className="mt-1 font-medium text-foreground">
                {user.roles.join(', ') || 'None'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email verification</dt>
              <dd className="mt-1 font-medium text-foreground">
                {isEmailVerified
                  ? `Verified${user.emailVerifiedAt ? ` at ${new Date(user.emailVerifiedAt).toLocaleString()}` : ''}`
                  : 'Not verified'}
              </dd>
            </div>
            {!isEmailVerified ? (
              <div>
                <dt className="sr-only">Send verification email</dt>
                <dd>
                  <RequestEmailVerificationButton className="w-full" />
                </dd>
              </div>
            ) : null}
          </div>
        </dl>
      </section>
    </main>
  );
}
