'use client';

import { useQuery } from '@tanstack/react-query';
import { currentUserQueryOptions } from '../queries';
import { useAuthSessionHint } from '../session-hint';

export function useCurrentUser() {
  const hasSessionHint = useAuthSessionHint();

  return useQuery(currentUserQueryOptions(hasSessionHint));
}
