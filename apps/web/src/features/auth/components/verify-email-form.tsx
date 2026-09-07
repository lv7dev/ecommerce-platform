'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { getApiErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/query/keys';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { verifyEmail } from '../api';
import { toAuthenticatedUser } from '../auth-user';
import { verifyEmailSchema, type VerifyEmailInput } from '../schemas';
import type { AuthenticatedUser } from '../types';
import { FieldError } from './field-error';

export function VerifyEmailForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const submittedTokenRef = useRef<string | null>(null);
  const form = useForm<VerifyEmailInput>({
    defaultValues: {
      token: '',
    },
    resolver: zodResolver(verifyEmailSchema),
  });
  const verifyEmailMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: async (result) => {
      queryClient.setQueryData(
        queryKeys.auth.me,
        (currentUser: AuthenticatedUser | null | undefined) =>
          toAuthenticatedUser(result.user, currentUser?.sessionId ?? ''),
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
  const verifyEmailMutate = verifyEmailMutation.mutate;

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      form.setValue('token', token, { shouldValidate: true });
      router.replace('/verify-email', { scroll: false });

      if (submittedTokenRef.current !== token) {
        submittedTokenRef.current = token;
        verifyEmailMutate({ token });
      }
    }
  }, [form, router, searchParams, verifyEmailMutate]);

  if (verifyEmailMutation.isSuccess) {
    return (
      <div className="space-y-5">
        <div className="rounded-md border bg-muted/40 p-4 text-sm text-foreground">
          Your email has been verified. Account pages will now show your email as verified.
        </div>
        <Button asChild className="w-full">
          <Link href="/account">Go to account</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => verifyEmailMutation.mutate(values))}
    >
      <div className="space-y-2">
        <Label htmlFor="token">Verification token</Label>
        <Input id="token" placeholder="Paste verification token" {...form.register('token')} />
        <FieldError message={form.formState.errors.token?.message} />
      </div>
      {verifyEmailMutation.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(verifyEmailMutation.error, 'Unable to verify email.')}
        </p>
      ) : null}
      <Button className="w-full" disabled={verifyEmailMutation.isPending} type="submit">
        <BadgeCheck className="size-4" />
        {verifyEmailMutation.isPending ? 'Verifying...' : 'Verify email'}
      </Button>
    </form>
  );
}
