'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/cn';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { submitSkinQuiz } from '@/server/actions/skin-quiz.actions';

const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'] as const;
const CONCERNS = [
  'Hydration',
  'Acne & breakouts',
  'Dark spots',
  'Fine lines',
  'Redness',
  'Dullness',
  'Excess oil',
  'Large pores',
  'Uneven tone',
  'Sensitivity',
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SkinQuiz() {
  const [step, setStep] = useState(0); // 0: type, 1: concerns, 2: email, 3: done
  const [skinType, setSkinType] = useState<string>('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleConcern = (c: string) =>
    setConcerns((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  async function submit() {
    if (email && !EMAIL_RE.test(email.trim())) {
      toast.error('Please enter a valid email, or leave it blank.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitSkinQuiz({
        email: email.trim() || undefined,
        skinType: skinType || undefined,
        concerns,
      });
      if (res.success) {
        // Meta Lead + Advanced Matching from the captured email.
        analytics.lead({ email: email.trim() || undefined, contentName: 'Skin Quiz' });
        setStep(3);
      } else {
        toast.error(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 3) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-6">
        <span className="flex items-center gap-2 text-sm font-medium text-success">
          <Check className="size-4" /> Your edit is ready
        </span>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          Thank you — we&apos;ve noted your{' '}
          <span className="font-medium text-foreground">{skinType || 'skin'}</span> profile
          {concerns.length ? (
            <>
              {' '}
              and focus on{' '}
              <span className="font-medium text-foreground">
                {concerns.slice(0, 3).join(', ').toLowerCase()}
              </span>
            </>
          ) : null}
          . {email ? 'Your personalised picks are on their way to your inbox.' : ''}
        </p>
        <Button asChild variant="cta" uppercase>
          <Link href="/products">Shop your edit</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 text-accent" />
        Find your match — {step + 1} of 3
      </div>

      {step === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">How would you describe your skin?</p>
          <div className="flex flex-wrap gap-2">
            {SKIN_TYPES.map((t) => (
              <Chip key={t} active={skinType === t} onClick={() => setSkinType(t)}>
                {t}
              </Chip>
            ))}
          </div>
          <div>
            <Button onClick={() => setStep(1)} disabled={!skinType} uppercase>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            What would you like to focus on? (choose any)
          </p>
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map((c) => (
              <Chip key={c} active={concerns.includes(c)} onClick={() => toggleConcern(c)}>
                {c}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)} uppercase>
              Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={concerns.length === 0} uppercase>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Where should we send your personalised edit? (optional)
          </p>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} uppercase>
              Back
            </Button>
            <Button onClick={submit} loading={submitting} uppercase>
              See my edit
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            We&apos;ll only use your email to send your recommendations and occasional beauty notes.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
        active
          ? 'border-transparent bg-foreground text-background'
          : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
