import { Suspense } from 'react';

import { buildMetadata } from '@/lib/seo/metadata';

import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export const metadata = buildMetadata({
  title: 'Set a new password',
  path: '/reset-password',
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Almost there</span>
        <h1 className="editorial-heading text-display-md">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
      </header>
      <Suspense fallback={<div className="h-56" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
