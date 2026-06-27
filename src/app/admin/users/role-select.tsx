'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { setUserRole } from '@/server/actions/admin/users.actions';

const ROLES = ['CUSTOMER', 'VIP', 'STAFF', 'ADMIN', 'SUPER_ADMIN'] as const;

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const [value, setValue] = useState(role);
  const [pending, start] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        const prev = value;
        setValue(next);
        start(async () => {
          const res = await setUserRole({ userId, role: next as (typeof ROLES)[number] });
          if (res.success) {
            toast.success('Role updated');
          } else {
            toast.error(res.message);
            setValue(prev);
          }
        });
      }}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
