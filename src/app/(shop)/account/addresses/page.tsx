import { buildMetadata } from '@/lib/seo/metadata';

import { EmptyState } from '@/design-system/primitives/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AddressActions } from './address-actions';
import { AddressForm } from './address-form';

import { requireUser } from '@/server/auth/guards';
import { addressesService } from '@/server/services/addresses.service';

export const metadata = buildMetadata({
  title: 'Addresses',
  path: '/account/addresses',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function AddressesPage() {
  const session = await requireUser();
  const addresses = await addressesService.list(session.sub);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="editorial-heading text-display-md">Addresses</h1>
        <p className="text-sm text-muted-foreground">
          {addresses.length > 0
            ? `${addresses.length} saved destination${addresses.length === 1 ? '' : 's'}.`
            : 'Saved shipping and billing destinations.'}
        </p>
      </header>

      {addresses.length === 0 ? (
        <EmptyState
          title="No addresses on file"
          description="Add one below or save one at checkout — it will appear here for next time."
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <Card className="h-full">
                <CardContent className="flex flex-col gap-2 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{a.fullName}</div>
                      {a.phone ? (
                        <div className="text-xs text-muted-foreground">{a.phone}</div>
                      ) : null}
                    </div>
                    {a.isDefault ? <Badge variant="gold">Default</Badge> : null}
                  </div>
                  <address className="text-sm not-italic leading-relaxed text-muted-foreground">
                    {a.addressLine1}
                    {a.addressLine2 ? (
                      <>
                        <br />
                        {a.addressLine2}
                      </>
                    ) : null}
                    <br />
                    {[a.city, a.area].filter(Boolean).join(', ')}
                    {a.postalCode ? ` ${a.postalCode}` : ''}
                    <br />
                    {a.country}
                  </address>
                  <div className="mt-2">
                    <AddressActions id={a.id} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add a new address</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm hasExistingAddresses={addresses.length > 0} />
        </CardContent>
      </Card>
    </div>
  );
}
