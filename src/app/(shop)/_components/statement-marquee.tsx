import { cn } from '@/lib/cn';

// Brand statements — the payoff words that define the line. Alternating filled
// and outlined type gives the band an editorial, couture rhythm.
const WORDS = [
  'High-pigment',
  'Second-skin',
  'Glass-finish',
  'Cruelty-free',
  'Small-batch',
  'Made luminous',
];

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {WORDS.map((word, i) => (
        <span key={i} className="flex items-center">
          <span
            className={cn(
              'mx-6 whitespace-nowrap font-serif text-3xl font-light tracking-tight md:mx-10 md:text-5xl',
              i % 2 === 1 && 'text-transparent [-webkit-text-stroke:1px_currentColor]',
            )}
          >
            {word}
          </span>
          <span aria-hidden className="text-brand-gold">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * Full-bleed scrolling statement band — a cinematic divider between sections.
 * Two identical rows translate -50% for a seamless loop; pauses under
 * prefers-reduced-motion.
 */
export function StatementMarquee({ className }: { className?: string }) {
  return (
    <section
      aria-hidden
      className={cn(
        'overflow-hidden border-y border-border/60 bg-foreground py-7 text-background md:py-10',
        className,
      )}
    >
      <div className="flex w-max animate-marquee items-center motion-reduce:animate-none">
        <Row />
        <Row />
      </div>
    </section>
  );
}
