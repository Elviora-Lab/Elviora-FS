import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';

export const metadata = buildMetadata({
  title: 'Sustainability',
  description:
    'How Kitchenly approaches responsible retail — durable products, thoughtful packaging, and steady progress.',
  path: '/sustainability',
});

export default function SustainabilityPage() {
  return (
    <Section>
      <div className="container flex max-w-3xl flex-col gap-12">
        <SectionHeading
          eyebrow="Our promise"
          title="Better, made carefully."
          description="We believe luxury and responsibility belong together. We are not perfect — but we are committed to honest, steady progress."
        />

        <div className="flex flex-col gap-4">
          <h2 className="editorial-heading text-display-sm">Our commitments</h2>
          <ul className="flex flex-col gap-3 text-pretty leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Thoughtful packaging.</span> We favour
              recyclable and refillable materials and ship with minimal, plastic-free protection.
            </li>
            <li>
              <span className="font-medium text-foreground">Honest sourcing.</span> We work with
              suppliers who meet our standards for quality and ethics.
            </li>
            <li>
              <span className="font-medium text-foreground">Considered production.</span> We make in
              measured quantities to reduce waste and overstock.
            </li>
          </ul>
        </div>

        <p className="text-pretty leading-relaxed text-muted-foreground">
          Sustainability is a journey rather than a destination. We will keep sharing our progress
          openly as our practices evolve.
        </p>
      </div>
    </Section>
  );
}
