'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { getApiErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { forgotPassword } from '../api';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas';
import { FieldError } from './field-error';

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordInput>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(forgotPasswordSchema),
  });
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
  });

  if (forgotPasswordMutation.isSuccess) {
    return (
      <div className="space-y-5">
        <div className="rounded-md border bg-muted/40 p-4 text-sm text-foreground">
          If the email exists, a reset link has been sent.
          {forgotPasswordMutation.data.expiresAt ? (
            <span className="block pt-2 text-muted-foreground">
              Token expires at {new Date(forgotPasswordMutation.data.expiresAt).toLocaleString()}.
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/login">Back to sign in</Link>
          </Button>
          <Button asChild className="flex-1" variant="outline">
            <Link href="/reset-password">Enter reset token</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => forgotPasswordMutation.mutate(values))}
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
      {forgotPasswordMutation.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(forgotPasswordMutation.error, 'Unable to request password reset.')}
        </p>
      ) : null}
      <Button className="w-full" disabled={forgotPasswordMutation.isPending} type="submit">
        <Mail className="size-4" />
        {forgotPasswordMutation.isPending ? 'Sending...' : 'Send reset link'}
      </Button>
    </form>
  );
}
