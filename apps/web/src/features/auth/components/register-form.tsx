'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { getApiErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/query/keys';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { register } from '../api';
import { toAuthenticatedUser } from '../auth-user';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { FieldError } from './field-error';

export function RegisterForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const form = useForm<RegisterFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      name: '',
      password: '',
    },
    resolver: zodResolver(registerSchema),
  });
  const registerMutation = useMutation({
    mutationFn: ({ email, name, password }: RegisterFormValues) =>
      register({
        email,
        name: name?.trim() ? name.trim() : undefined,
        password,
      }),
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.auth.me, toAuthenticatedUser(session.user));
      router.replace('/products');
      router.refresh();
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input autoComplete="name" id="name" placeholder="Your name" {...form.register('name')} />
        <FieldError message={form.formState.errors.name?.message} />
      </div>
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
          autoComplete="new-password"
          id="password"
          placeholder="At least 12 characters"
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
      {registerMutation.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(registerMutation.error, 'Unable to create account.')}
        </p>
      ) : null}
      <Button className="w-full" disabled={registerMutation.isPending} type="submit">
        <UserPlus className="size-4" />
        {registerMutation.isPending ? 'Creating account...' : 'Create account'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Button asChild variant="link">
          <Link href="/login">Sign in</Link>
        </Button>
      </p>
    </form>
  );
}
