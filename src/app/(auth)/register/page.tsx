import Link from 'next/link';

import { buildMetadata } from '@/lib/seo/metadata';

import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata = buildMetadata({
  title: 'Create account',
  path: '/register',
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Begin your ritual</span>
        <h1 className="editorial-heading text-display-md">Create your Elviora account</h1>
      </header>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        Already a member?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
