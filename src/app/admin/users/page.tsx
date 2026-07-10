import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/utils/format';

import { Card, CardContent } from '@/components/ui/card';

import { RoleSelect } from './role-select';

import { adminUsersRepo } from '@/server/repositories/admin.repo';

export const metadata = buildMetadata({ title: 'Admin · Users', noIndex: true });
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const [users, total] = await adminUsersRepo.list({ take: 100 });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="editorial-heading text-display-md">Users</h1>
        <p className="text-sm text-muted-foreground">
          {total} customer account{total === 1 ? '' : 's'} · manage roles.
        </p>
      </header>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-3">
                      {`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 tabular-nums">{u._count.orders}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(u.createdAt, { dateStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3">
                      <RoleSelect userId={u.id} role={u.role} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
