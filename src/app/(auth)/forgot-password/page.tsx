import { buildMetadata } from '@/lib/seo/metadata';

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
      <p className="text-sm text-muted-foreground">
        Form wired to <code className="font-mono text-xs">useForgotPasswordMutation</code> — extend
        with the same RHF + Zod pattern as <code className="font-mono text-xs">LoginForm</code>.
      </p>
    </div>
  );
}
