'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from './button';

type ToastVariant = 'success' | 'error';

interface ToastInput {
  description?: string;
  durationMs?: number;
  title: string;
  variant?: ToastVariant;
}

interface ToastItem extends Required<Omit<ToastInput, 'description'>> {
  description?: string;
  id: string;
}

interface ToastContextValue {
  dismissToast: (id: string) => void;
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ description, durationMs = 3500, title, variant = 'success' }: ToastInput) => {
      const id = crypto.randomUUID();

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          description,
          durationMs,
          id,
          title,
          variant,
        },
      ]);

      window.setTimeout(() => dismissToast(id), durationMs);
    },
    [dismissToast],
  );

  const contextValue = useMemo(
    () => ({
      dismissToast,
      showToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}

interface ToastViewportProps {
  onDismiss: (id: string) => void;
  toasts: ToastItem[];
}

function ToastViewport({ onDismiss, toasts }: ToastViewportProps) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-relevant="additions removals"
      className="fixed bottom-4 right-4 z-50 grid w-[calc(100%-2rem)] max-w-sm gap-2 sm:bottom-6 sm:right-6"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

interface ToastCardProps {
  onDismiss: () => void;
  toast: ToastItem;
}

function ToastCard({ onDismiss, toast }: ToastCardProps) {
  const Icon = toast.variant === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg',
        toast.variant === 'success' ? 'border-success/40' : 'border-destructive/40',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 size-5',
          toast.variant === 'success' ? 'text-success' : 'text-destructive',
        )}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{toast.description}</p>
        ) : null}
      </div>
      <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onDismiss}>
        <X className="size-4" />
        <span className="sr-only">Dismiss notification</span>
      </Button>
    </div>
  );
}
