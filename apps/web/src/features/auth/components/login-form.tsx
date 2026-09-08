'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { getApiErrorMessage } from '@/shared/api/errors';
import { prepareGuestCartAfterAuth } from '@/features/cart/merge';
import { queryKeys } from '@/shared/query/keys';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { login } from '../api';
import { toAuthenticatedUser } from '../auth-user';
import { getSafeRedirectPath } from '../redirect';
import { loginSchema, type LoginInput } from '../schemas';
import { setAuthSessionHint } from '../session-hint';
import { FieldError } from './field-error';

export function LoginForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get('redirectTo'));
  const form = useForm<LoginInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (session) => {
      setAuthSessionHint();
      queryClient.setQueryData(queryKeys.auth.me, toAuthenticatedUser(session.user));
      const mergeResult = await prepareGuestCartAfterAuth(queryClient);

      if (mergeResult.status === 'review') {
        router.replace(`/cart/merge?redirectTo=${encodeURIComponent(redirectTo)}`);
        router.refresh();
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          id="email"
          placeholder="you@example.com"
          type="email"
          {...form.register('email')}
        />
        <FieldError message={form.formState.errors.email?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          autoComplete="current-password"
          id="password"
          placeholder="Enter your password"
          type="password"
          {...form.register('password')}
        />
        <FieldError message={form.formState.errors.password?.message} />
      </div>
      {loginMutation.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(loginMutation.error, 'Unable to sign in.')}
        </p>
      ) : null}
      <Button className="w-full" disabled={loginMutation.isPending} type="submit">
        <LogIn className="size-4" />
        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Button asChild variant="link">
          <Link href="/forgot-password">Forgot password?</Link>
        </Button>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        New customer?{' '}
        <Button asChild variant="link">
          <Link href={`/register?redirectTo=${encodeURIComponent(redirectTo)}`}>
            Create an account
          </Link>
        </Button>
      </p>
    </form>
  );
}
