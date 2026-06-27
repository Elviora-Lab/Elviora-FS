import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';

import { Section, SectionHeading } from '@/design-system/primitives/section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const metadata = buildMetadata({
  title: 'FAQ',
  description:
    'Answers to the questions we hear most — shipping, returns, payments, and product care at Elviora.',
  path: '/faq',
});

export default function FaqPage() {
  return (
    <Section>
      <div className="container flex max-w-3xl flex-col gap-10">
        <SectionHeading
          eyebrow="Help centre"
          title="Frequently asked questions"
          description="The essentials, gathered in one place. Need something more specific? Our team is one message away."
        />

        <Accordion type="single" collapsible defaultValue="shipping">
          <AccordionItem value="shipping">
            <AccordionTrigger>How long does delivery take?</AccordionTrigger>
            <AccordionContent>
              Orders within Pakistan are typically delivered in 2 to 5 business days. We offer
              complimentary shipping on orders over Rs 15,000.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="returns">
            <AccordionTrigger>What is your returns policy?</AccordionTrigger>
            <AccordionContent>
              Unopened products may be returned within 30 days of delivery for a full refund. Visit
              our{' '}
              <Link className="text-foreground underline underline-offset-4" href="/shipping">
                shipping &amp; returns
              </Link>{' '}
              page for details.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payment">
            <AccordionTrigger>Which payment methods do you accept?</AccordionTrigger>
            <AccordionContent>
              We accept major debit and credit cards as well as cash on delivery across Pakistan.
              All prices are shown in Pakistani Rupees (Rs).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="authenticity">
            <AccordionTrigger>Are your products authentic?</AccordionTrigger>
            <AccordionContent>
              Every product sold on Elviora is sourced directly and guaranteed authentic, with full
              ingredient transparency on each listing.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="order">
            <AccordionTrigger>How do I track my order?</AccordionTrigger>
            <AccordionContent>
              Sign in to your{' '}
              <Link className="text-foreground underline underline-offset-4" href="/account">
                account
              </Link>{' '}
              to view live order status and your full purchase history.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Section>
  );
}
