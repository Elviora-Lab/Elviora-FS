import { cn } from '@/lib/cn';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/utils/format';

import { EmptyState } from '@/design-system/primitives/empty-state';
import { Button } from '@/components/ui/button';

import { markNotificationsRead } from '@/server/actions/notifications.actions';
import { requireUser } from '@/server/auth/guards';
import { notificationsRepo } from '@/server/repositories/notifications.repo';

export const metadata = buildMetadata({
  title: 'Notifications',
  path: '/account/notifications',
  noIndex: true,
});
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await requireUser();
  const notifications = await notificationsRepo.listForUser(session.sub);
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="editorial-heading text-display-sm">Notifications</h1>
        {hasUnread ? (
          <form
            action={async () => {
              'use server';
              await markNotificationsRead();
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Mark all read
            </Button>
          </form>
        ) : null}
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Order updates and announcements will appear here."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {notifications.map((n) => (
            <li key={n.id} className="flex gap-3 py-4">
              <span
                aria-hidden
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  n.isRead ? 'bg-transparent' : 'bg-brand-rosegold',
                )}
              />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm', n.isRead ? 'font-normal' : 'font-medium')}>
                    {n.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {n.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <span className="text-xs text-muted-foreground/70">
                  {formatDate(n.createdAt, { dateStyle: 'medium' })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
