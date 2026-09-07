'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ErrorState } from '@/shared/ui/error-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { hasAnyRole, hasPermission } from '../permissions';
import { currentUserQueryOptions } from '../queries';
import type { AuthRole } from '../types';

interface AuthGuardProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  permissions?: string[];
  redirectTo?: string;
  roles?: AuthRole[];
}

export function AuthGuard({
  children,
  loadingFallback,
  permissions = [],
  redirectTo = '/login',
  roles = [],
}: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isError, isLoading, refetch } = useQuery(currentUserQueryOptions());

  useEffect(() => {
    if (!isLoading && !isError && !user) {
      router.replace(`${redirectTo}?redirectTo=${encodeURIComponent(pathname)}`);
    }
  }, [isError, isLoading, pathname, redirectTo, router, user]);

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      )
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="We could not verify your session."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!user) {
    return null;
  }

  const canAccessRole = roles.length === 0 || hasAnyRole(user, roles);
  const canAccessPermission =
    permissions.length === 0 || permissions.every((permission) => hasPermission(user, permission));

  if (!canAccessRole || !canAccessPermission) {
    return (
      <ErrorState
        icon={ShieldAlert}
        message="Your account does not have permission to view this page."
        title="Access denied"
      />
    );
  }

  return children;
}
