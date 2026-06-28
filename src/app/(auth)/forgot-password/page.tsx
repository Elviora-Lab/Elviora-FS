import { Suspense } from 'react';
import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';

import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata = buildMetadata({
  title: 'Reset password',
  path: '/forgot-password',
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">No worries</span>
        <h1 className="editorial-heading text-display-md">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a secure link to set a new one.
        </p>
      </header>
      <Suspense fallback={<div className="h-40" />}>
        <ForgotPasswordForm />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
