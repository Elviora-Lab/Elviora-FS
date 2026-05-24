import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-wide transition-all duration-300 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border border-border bg-transparent text-foreground hover:border-foreground/30 hover:bg-muted',
        ghost: 'bg-transparent text-foreground hover:bg-muted',
        link: 'px-0 text-foreground underline-offset-4 hover:underline',
        gold: 'bg-gradient-gold text-brand-charcoal shadow-luxe hover:opacity-95',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-12 px-8 text-sm',
        xl: 'h-14 px-10 text-base',
        icon: 'h-10 w-10',
      },
      uppercase: {
        true: 'uppercase tracking-[0.14em]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, uppercase, asChild, loading, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  const buttonClassName = cn(buttonVariants({ variant, size, uppercase }), className);

  // When asChild is true, Slot uses React.Children.only — so we MUST forward
  // exactly one child. Skip the loading spinner injection in that case.
  if (asChild) {
    return (
      <Comp ref={ref} className={buttonClassName} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <button ref={ref} className={buttonClassName} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : null}
      {children}
    </button>
  );
});

export { buttonVariants };
