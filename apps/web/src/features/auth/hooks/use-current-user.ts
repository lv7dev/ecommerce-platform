'use client';

import { useQuery } from '@tanstack/react-query';
import { currentUserQueryOptions } from '../queries';

export function useCurrentUser() {
  return useQuery(currentUserQueryOptions());
}
