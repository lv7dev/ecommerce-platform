import { cn } from '@/shared/lib/cn';

interface PriceProps {
  amount?: number;
  amountMinor?: number | string | null;
  className?: string;
  currency?: string;
  locale?: string;
}

export function Price({
  amount,
  amountMinor,
  className,
  currency = 'USD',
  locale = 'en-US',
}: PriceProps) {
  const value =
    amount ??
    (amountMinor === null || amountMinor === undefined
      ? null
      : Number(amountMinor) / 10 ** getCurrencyMinorDigits(currency));

  if (value === null || Number.isNaN(value)) {
    return <span className={cn('tabular-nums text-muted-foreground', className)}>Contact</span>;
  }

  return (
    <span className={cn('tabular-nums', className)}>
      {new Intl.NumberFormat(locale, {
        currency,
        style: 'currency',
      }).format(value)}
    </span>
  );
}

function getCurrencyMinorDigits(currency: string) {
  return (
    new Intl.NumberFormat('en-US', {
      currency,
      style: 'currency',
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}
