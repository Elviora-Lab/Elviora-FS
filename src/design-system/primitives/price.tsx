import { cn } from '@/lib/cn';
import { formatMoney } from '@/utils/format';

type PriceProps = {
  amount: number;
  currency?: string;
  compareAt?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export function Price({ amount, compareAt, currency = 'USD', size = 'md', className }: PriceProps) {
  const onSale = typeof compareAt === 'number' && compareAt > amount;
  return (
    <span className={cn('inline-flex items-baseline gap-2', sizeMap[size], className)}>
      <span className={cn('font-medium', onSale && 'text-destructive')}>
        {formatMoney(amount, currency)}
      </span>
      {onSale ? (
        <span className="text-xs text-muted-foreground line-through">
          {formatMoney(compareAt, currency)}
        </span>
      ) : null}
    </span>
  );
}
