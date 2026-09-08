import { AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from './button';

interface ErrorStateProps {
  className?: string;
  icon?: LucideIcon;
  message?: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  className,
  icon: Icon = AlertCircle,
  message = 'Something went wrong. Please try again.',
  onRetry,
  title = 'Unable to load data',
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-52 flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 p-8 text-center',
        className,
      )}
    >
      <Icon className="mb-3 size-8 text-destructive" />
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
