'use client';

import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import { getApiErrorMessage } from '@/shared/api/errors';
import { Button, type ButtonProps } from '@/shared/ui/button';
import { requestEmailVerification } from '../api';

export function RequestEmailVerificationButton({
  children = 'Send verification email',
  disabled,
  ...props
}: ButtonProps) {
  const requestVerificationMutation = useMutation({
    mutationFn: requestEmailVerification,
  });

  return (
    <div className="space-y-2">
      <Button
        {...props}
        disabled={requestVerificationMutation.isPending || disabled}
        onClick={() => requestVerificationMutation.mutate()}
        variant={props.variant ?? 'outline'}
      >
        <MailCheck className="size-4" />
        {requestVerificationMutation.isPending ? 'Sending...' : children}
      </Button>
      {requestVerificationMutation.isSuccess ? (
        <p className="text-sm text-muted-foreground">
          {requestVerificationMutation.data.alreadyVerified
            ? 'Your email is already verified.'
            : 'Verification email has been sent.'}
        </p>
      ) : null}
      {requestVerificationMutation.isError ? (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(
            requestVerificationMutation.error,
            'Unable to request email verification.',
          )}
        </p>
      ) : null}
    </div>
  );
}
