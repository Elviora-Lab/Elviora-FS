'use client';

import { Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/cn';

type QuantitySelectorProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  className,
}: QuantitySelectorProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-md border border-border',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        className="grid size-10 place-items-center transition-colors hover:bg-muted"
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-10 text-center text-sm tabular-nums">{value}</span>
      <button
        type="button"
        onClick={inc}
        className="grid size-10 place-items-center transition-colors hover:bg-muted"
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
