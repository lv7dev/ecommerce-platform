'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { queryKeys } from '@/shared/query/keys';
import { Button, type ButtonProps } from '@/shared/ui/button';
import { logout } from '../api';
import { clearAuthSessionHint } from '../session-hint';

export function LogoutButton({
  children = 'Sign out',
  disabled,
  onClick,
  variant = 'outline',
  ...props
}: ButtonProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.me });
      clearAuthSessionHint();
      queryClient.setQueryData(queryKeys.auth.me, null);
      router.push('/login');
      router.refresh();
    },
  });

  return (
    <Button
      {...props}
      disabled={logoutMutation.isPending || disabled}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          logoutMutation.mutate();
        }
      }}
      variant={variant}
    >
      <LogOut className="size-4" />
      {logoutMutation.isPending ? 'Signing out...' : children}
    </Button>
  );
}
