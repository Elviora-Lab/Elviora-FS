import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Shown on every sub-page when Meta Ads env vars aren't configured yet. */
export function SetupCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Connect Meta Ads</CardTitle>
        <CardDescription>
          Read-only — this dashboard only reads your ad performance; it never changes campaigns or
          spends money.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
        <ol className="ml-4 list-decimal space-y-2">
          <li>
            In <strong>Business Settings → Users → System Users</strong>, create (or open) a system
            user and <strong>Generate a token</strong> for your app with the <code>ads_read</code>{' '}
            permission.
          </li>
          <li>
            Assign that system user to your <strong>ad account</strong> with view access.
          </li>
          <li>
            Copy your <strong>ad account id</strong> (Ads Manager → Account overview — the number
            after <code>act_</code>).
          </li>
          <li>
            Set these environment variables and redeploy:
            <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
              META_ADS_ACCESS_TOKEN=EAAG...your_system_user_token{'\n'}
              META_ADS_ACCOUNT_ID=1234567890
            </pre>
          </li>
        </ol>
        <p>
          Same permissions wall as the Conversions API token — you need an admin role on the
          Business and ad account to generate it. Until both variables are set, this page stays
          exactly as it is now. Full walkthrough in <code>docs/meta-ads-dashboard.md</code>.
        </p>
      </CardContent>
    </Card>
  );
}

/** Shown when a submodule's Graph API call fails. */
export function AdsErrorCard({ error }: { error: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Couldn’t load ad data</CardTitle>
        <CardDescription>Meta’s API returned an error.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-md bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
          {error}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Common causes: the token lacks <code>ads_read</code>, the ad account id is wrong, or the
          token has expired. See the setup steps and try again.
        </p>
      </CardContent>
    </Card>
  );
}
