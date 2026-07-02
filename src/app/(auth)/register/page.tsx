import { redirect } from 'next/navigation';

import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Create account',
  path: '/register',
  noIndex: true,
});

// Customer self-registration is disabled — the storefront is guest-only.
// Admin accounts are provisioned directly, so there's no public sign-up.
export default function RegisterPage() {
  redirect('/');
}
