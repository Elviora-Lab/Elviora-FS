import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';

export const metadata = buildMetadata({
  title: 'About',
  description:
    'The story behind Kitchenly — a home essentials brand built on tested tools, honest pricing, and the belief that a well-run home is a kind of luxury.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <Section>
      <div className="container flex max-w-3xl flex-col gap-12">
        <SectionHeading
          eyebrow="Our story"
          title="Home, considered."
          description="Kitchenly began with a simple belief: the right tool, in the right drawer, makes the whole day run smoother."
        />

        <div className="flex flex-col gap-6 text-pretty leading-relaxed text-muted-foreground">
          <p>
            Founded in Karachi, Kitchenly is a house of practical home essentials made for people
            who notice the details. Every shade, texture, and finish is developed slowly — tested,
            adjusted, and tested again — until it feels effortless on the skin.
          </p>
          <p>
            We work with manufacturers who share our standards and source materials and finishes
            that perform without compromise. Nothing reaches a shelf until it earns its place in a
            daily routine.
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
              materials and build quality we are proud to stand behind.
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
