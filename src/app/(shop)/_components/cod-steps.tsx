import { Reveal } from '@/design-system/primitives/reveal';

/**
 * The COD ritual — three steps that convert "can I trust an online store?"
 * into "I literally pay when it's in my hands." Oversized ghosted serif
 * numerals give the closing navy chapter its editorial stamp. Server
 * component; entrance is staggered Reveals.
 */
const STEPS = [
  {
    n: '01',
    title: 'Order in two minutes',
    sub: 'No card, no account needed — checkout as a guest.',
  },
  {
    n: '02',
    title: 'We pack & dispatch',
    sub: 'Quality-checked, tracked to your door, nationwide.',
  },
  {
    n: '03',
    title: 'Pay at your door',
    sub: 'Cash on delivery — and easy 2–3 day returns if it’s not right.',
  },
];

export function CodSteps() {
  return (
    <div className="grid gap-6 md:grid-cols-3 md:gap-8">
      {STEPS.map((s, i) => (
        <Reveal key={s.n} inView delay={i * 0.12}>
          <div className="relative flex min-h-32 flex-col justify-end overflow-hidden rounded-2xl border border-border bg-card/50 p-5 transition-colors duration-300 hover:border-accent/50">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 -top-6 font-serif text-[7rem] font-semibold leading-none text-foreground/[0.07]"
            >
              {s.n}
            </span>
            <h3 className="relative font-sans text-base font-semibold">{s.title}</h3>
            <p className="relative mt-1 text-sm leading-relaxed text-muted-foreground">{s.sub}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
