import { cn } from '@/lib/cn';
import { formatMoney } from '@/utils/format';

type PriceProps = {
  amount: number;
  currency?: string;
  compareAt?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Show a "Save X%" savings pill when on sale (price anchoring). */
  showSavings?: boolean;
};

const sizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export function Price({
  amount,
  compareAt,
  currency = 'PKR',
  size = 'md',
  className,
  showSavings = false,
}: PriceProps) {
  const onSale = typeof compareAt === 'number' && compareAt > amount;
  const savedPct = onSale ? Math.round(((compareAt - amount) / compareAt) * 100) : 0;
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-2', sizeMap[size], className)}>
      <span className={cn('font-medium', onSale && 'text-destructive')}>
        {formatMoney(amount, currency)}
      </span>
      {onSale ? (
        <span className="text-xs text-muted-foreground line-through">
          {formatMoney(compareAt, currency)}
        </span>
      ) : null}
      {onSale && showSavings && savedPct > 0 ? (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
          Save {savedPct}%
        </span>
      ) : null}
    </span>
  );
}
