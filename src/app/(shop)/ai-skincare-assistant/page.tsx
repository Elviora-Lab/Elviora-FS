import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';
import { SkincareViewTracker } from '@/components/analytics/pixel-trackers';
import { Button } from '@/components/ui/button';

export const metadata = buildMetadata({
  title: 'Beauty Concierge',
  description:
    'Book a personal consultation with the Elviora Beauty Concierge for considered, one-to-one guidance.',
  path: '/ai-skincare-assistant',
});

export default function BeautyConciergePage() {
  return (
    <Section>
      <SkincareViewTracker />
      <div className="container flex max-w-3xl flex-col gap-12">
        <SectionHeading
          eyebrow="Beauty Concierge"
          title="A consultation, made personal."
          description="Some choices are easier with a guide. Our Beauty Concierge offers thoughtful, one-to-one advice to help you find your perfect match."
        />

        <div className="flex flex-col gap-6 text-pretty leading-relaxed text-muted-foreground">
          <p>
            Tell us about your routine, your preferences, and what you are hoping to find. A member
            of our team will help you navigate shades, textures, and finishes — and build an edit
            that feels entirely yours.
          </p>
          <p>
            Consultations are complimentary and unhurried. There is no script and no pressure, just
            considered guidance from people who love what they do.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="editorial-heading text-display-sm">What to expect</h2>
          <ul className="flex flex-col gap-3 text-pretty leading-relaxed text-muted-foreground">
            <li>A relaxed conversation about your goals and current routine.</li>
            <li>Tailored product suggestions across the Elviora collection.</li>
            <li>Honest advice — including when something is not right for you.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/contact">Book a consultation</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">Explore the collection</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
