'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getApiErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { resetPassword } from '../api';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas';
import { FieldError } from './field-error';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<ResetPasswordFormValues>({
    defaultValues: {
      confirmPassword: '',
      password: '',
      token: '',
    },
    resolver: zodResolver(resetPasswordSchema),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
  });

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      form.setValue('token', token, { shouldValidate: true });
      router.replace('/reset-password', { scroll: false });
    }
  }, [form, router, searchParams]);

  if (resetPasswordMutation.isSuccess) {
    return (
      <div className="space-y-5">
        <div className="rounded-md border bg-muted/40 p-4 text-sm text-foreground">
          Your password has been updated.
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Sign in with new password</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) =>
        resetPasswordMutation.mutate({
          password: values.password,
          token: values.token,
        }),
      )}
    >
      <div className="space-y-2">
        <Label htmlFor="token">Reset token</Label>
        <Input id="token" placeholder="Paste reset token" {...form.register('token')} />
        <FieldError message={form.formState.errors.token?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          autoComplete="new-password"
          id="password"
          placeholder="At least 8 characters"
          type="password"
          {...form.register('password')}
        />
        <FieldError message={form.formState.errors.password?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          autoComplete="new-password"
          id="confirmPassword"
          placeholder="Repeat your password"
          type="password"
          {...form.register('confirmPassword')}
        />
        <FieldError message={form.formState.errors.confirmPassword?.message} />
      </div>
      {resetPasswordMutation.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(resetPasswordMutation.error, 'Unable to reset password.')}
        </p>
      ) : null}
      <Button className="w-full" disabled={resetPasswordMutation.isPending} type="submit">
        <KeyRound className="size-4" />
        {resetPasswordMutation.isPending ? 'Updating...' : 'Update password'}
      </Button>
    </form>
  );
}
