'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { cn } from '@/lib/cn';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { createAddress } from '@/server/actions/addresses.actions';

export function AddressForm({ hasExistingAddresses }: { hasExistingAddresses: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    const payload = {
      fullName: String(formData.get('fullName') ?? ''),
      phone: String(formData.get('phone') ?? '') || undefined,
      country: String(formData.get('country') ?? '').toUpperCase(),
      city: String(formData.get('city') ?? ''),
      area: String(formData.get('area') ?? '') || undefined,
      addressLine1: String(formData.get('addressLine1') ?? ''),
      addressLine2: String(formData.get('addressLine2') ?? '') || undefined,
      postalCode: String(formData.get('postalCode') ?? '') || undefined,
      isDefault: formData.get('isDefault') === 'on',
    };

    start(async () => {
      const result = await createAddress(payload);
      if (result.success) {
        toast.success('Address saved');
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Field label="Full name *">
        <Input name="fullName" required />
      </Field>
      <Field label="Phone">
        <Input name="phone" type="tel" />
      </Field>
      <Field label="Country (ISO-2) *">
        {/* PK to match checkout — shipping rates are computed for Pakistan. */}
        <Input name="country" required maxLength={2} placeholder="PK" defaultValue="PK" />
      </Field>
      <Field label="City *">
        <Input name="city" required />
      </Field>
      <Field label="Area / state">
        <Input name="area" />
      </Field>
      <Field label="Postal code">
        <Input name="postalCode" />
      </Field>
      <Field label="Address line 1 *" className="md:col-span-2">
        <Input name="addressLine1" required />
      </Field>
      <Field label="Address line 2" className="md:col-span-2">
        <Input name="addressLine2" />
      </Field>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={!hasExistingAddresses}
          className="size-4 rounded border-border accent-foreground"
        />
        Make this my default address
      </label>
      <div className="md:col-span-2">
        <Button type="submit" loading={pending}>
          Save address
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
