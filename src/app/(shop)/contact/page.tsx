import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';
import { ContactLink } from '@/components/analytics/pixel-trackers';

export const metadata = buildMetadata({
  title: 'Contact',
  description:
    'Reach the Elviora client care team — we are here to help with orders, products, and anything in between.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <Section>
      <div className="container flex max-w-3xl flex-col gap-12">
        <SectionHeading
          eyebrow="Client care"
          title="We would love to hear from you."
          description="Whether it is a question about a formula, an order, or a recommendation, our team is happy to help."
        />

        <div className="flex flex-col gap-4">
          <h2 className="editorial-heading text-display-sm">Email us</h2>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Write to{' '}
            <ContactLink
              className="font-medium text-foreground underline underline-offset-4"
              href="mailto:hello@elviora.com"
            >
              hello@elviora.com
            </ContactLink>{' '}
            and a member of our client care team will reply within one business day.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="editorial-heading text-display-sm">Order help</h2>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            For questions about an existing order, sign in to your{' '}
            <Link
              className="font-medium text-foreground underline underline-offset-4"
              href="/account"
            >
              account
            </Link>{' '}
            to view status and history. Details on delivery and returns live on our{' '}
            <Link
              className="font-medium text-foreground underline underline-offset-4"
              href="/shipping"
            >
              shipping &amp; returns
            </Link>{' '}
            page.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Client care hours: Monday to Saturday, 10am to 7pm (PKT).
        </p>
      </div>
    </Section>
  );
}
