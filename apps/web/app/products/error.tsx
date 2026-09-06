'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/shared/ui/error-state';

interface ProductsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <ErrorState
        title="Product catalog crashed"
        message="The catalog UI hit an unexpected rendering error."
        onRetry={reset}
      />
    </section>
  );
}
