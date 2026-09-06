'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import { makeQueryClient } from '@/shared/query/query-client';
import { TooltipProvider } from '@/shared/ui/tooltip';

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = React.useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
