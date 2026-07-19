import { cn } from '@/lib/cn';

type LoaderProps = {
  size?: number;
  className?: string;
  label?: string;
};

export function Loader({ size = 24, className, label = 'Loading' }: LoaderProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Loader size={32} label={label} className="text-brand-amber" />
    </div>
  );
}
