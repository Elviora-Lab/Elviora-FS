import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';

export const metadata = buildMetadata({
  title: 'About',
  description:
    'The story behind Elviora — a luxury beauty house built on considered formulas, honest ingredients, and a quiet sense of ritual.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <Section>
      <div className="container flex max-w-3xl flex-col gap-12">
        <SectionHeading
          eyebrow="Our story"
          title="Beauty, considered."
          description="Elviora began with a simple belief: that getting ready should feel like a moment of quiet luxury, not a chore."
        />

        <div className="flex flex-col gap-6 text-pretty leading-relaxed text-muted-foreground">
          <p>
            Founded in Lahore, Elviora is a house of refined cosmetics made for people who notice
            the details. Every shade, texture, and finish is developed slowly — tested, adjusted,
            and tested again — until it feels effortless on the skin.
          </p>
          <p>
            We work with formulators who share our standards and source pigments and actives that
            perform without compromise. Nothing reaches a shelf until it earns its place in a daily
            ritual.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="editorial-heading text-display-sm">What we stand for</h2>
          <ul className="flex flex-col gap-3 text-pretty leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Considered formulas.</span> Fewer,
              better products that do exactly what they promise.
            </li>
            <li>
              <span className="font-medium text-foreground">Honest ingredients.</span> Transparent
              labels and pigments we are proud to name.
            </li>
            <li>
              <span className="font-medium text-foreground">Quiet luxury.</span> Packaging and
              service designed to feel personal, never excessive.
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
