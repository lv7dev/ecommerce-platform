'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { getApiErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/query/keys';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { hasAnyRole } from '../permissions';
import { getSafeRedirectPath } from '../redirect';
import { loginSchema, type LoginInput } from '../schemas';
import { setAuthSessionHint } from '../session-hint';
import { toAuthenticatedUser } from '../auth-user';
import { login, logout } from '../api';
import { FieldError } from './field-error';

const ADMIN_ROLES = ['ADMIN', 'STAFF'] as const;

export function AdminLoginForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get('redirectTo'), '/');
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
      const user = toAuthenticatedUser(session.user);

      if (!hasAnyRole(user, [...ADMIN_ROLES])) {
        await logout().catch(() => undefined);
        queryClient.setQueryData(queryKeys.auth.me, null);
        form.setError('root', {
          message: 'This account does not have access to Admin.',
        });
        return;
      }

      setAuthSessionHint();
      queryClient.setQueryData(queryKeys.auth.me, user);
      router.replace(redirectTo);
      router.refresh();
    },
  });
  const rootError =
    form.formState.errors.root?.message ??
    (loginMutation.isError ? getApiErrorMessage(loginMutation.error, 'Unable to sign in.') : null);

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
          placeholder="admin@example.com"
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
      {rootError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {rootError}
        </p>
      ) : null}
      <Button className="w-full" disabled={loginMutation.isPending} type="submit">
        <LogIn className="size-4" />
        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
