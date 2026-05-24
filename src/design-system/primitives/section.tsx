import { cn } from '@/lib/cn';

import { Reveal } from './reveal';

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div' | 'article';
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 'py-12 md:py-16',
  md: 'py-20 md:py-28',
  lg: 'py-28 md:py-40',
};

export function Section({ as: Tag = 'section', size = 'md', className, ...props }: SectionProps) {
  return <Tag className={cn(sizeMap[size], className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <Reveal
      inView
      className={cn(
        'flex max-w-3xl flex-col gap-3',
        align === 'center' && 'mx-auto items-center text-center',
        className,
      )}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 className="editorial-heading text-display-md md:text-display-lg">{title}</h2>
      {description ? (
        <p className="text-pretty text-base leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </Reveal>
  );
}
