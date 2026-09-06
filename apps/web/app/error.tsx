'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/shared/ui/error-state';

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-12">
      <ErrorState
        title="Something broke"
        message="The storefront could not render this page. Try again or return to the previous page."
        onRetry={reset}
      />
    </main>
  );
}
