import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from './button';

interface EmptyStateProps {
  action?: {
    label: string;
    onClick?: () => void;
  };
  className?: string;
  description?: string;
  icon?: LucideIcon;
  title: string;
}

export function EmptyState({ action, className, description, icon: Icon, title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-52 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center',
        className,
      )}
    >
      {Icon ? <Icon className="mb-3 size-8 text-muted-foreground" /> : null}
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? (
        <Button className="mt-5" variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
