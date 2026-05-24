import { buildMetadata } from '@/lib/seo/metadata';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = buildMetadata({
  title: 'Admin · Dashboard',
  noIndex: true,
});

const kpis = [
  { label: 'Revenue (30d)', value: '$182,450' },
  { label: 'Orders (30d)', value: '1,284' },
  { label: 'Conversion', value: '3.21%' },
  { label: 'AOV', value: '$142.17' },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="editorial-heading text-display-md">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An at-a-glance view of the house.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader>
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-3xl">{k.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="shimmer h-12 rounded bg-muted/40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
