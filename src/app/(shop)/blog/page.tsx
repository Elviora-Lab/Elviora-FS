import { buildMetadata } from '@/lib/seo/metadata';

import { EmptyState } from '@/design-system/primitives/empty-state';
import { Section, SectionHeading } from '@/design-system/primitives/section';

export const metadata = buildMetadata({
  title: 'The Journal',
  description: 'Editorial — skincare science, rituals, and conversations from the Elviora studio.',
  path: '/blog',
});

export default function BlogIndexPage() {
  return (
    <Section>
      <div className="container flex flex-col gap-10">
        <SectionHeading
          eyebrow="The Journal"
          title="Skincare, considered."
          description="Slow reads on ingredients, rituals, and the people behind the formulas."
        />
        {/* Wire to GET /api/v1/blog once the service is implemented. */}
        <EmptyState
          title="The first issue is coming soon"
          description="Our editors are finalising the inaugural edition. Subscribe below and we will let you know when it's out."
        />
      </div>
    </Section>
  );
}
