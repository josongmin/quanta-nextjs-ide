import { useMemo } from 'react';
import { Bell } from 'lucide-react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  useNotificationStore,
  type Notification,
  type NotificationAction,
  type NotificationKind,
} from '@entities/notification';
import { Button, Chip, EmptyState, Icon, OverlayPanel, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';

const ONE_DAY = 24 * 60 * 60 * 1000;

const KIND_LABEL: Record<NotificationKind, string> = {
  risk: 'risk',
  pr: 'PR',
  build: 'build',
  analysis: 'analysis',
  tip: 'tip',
};

const kindTone = (k: NotificationKind) =>
  match(k)
    .with('risk', () => 'err' as const)
    .with('pr', () => 'accent' as const)
    .with('build', () => 'info' as const)
    .with('analysis', () => 'warn' as const)
    .with('tip', () => 'muted' as const)
    .exhaustive();

function KindIcon({ kind }: { kind: NotificationKind }) {
  const I = match(kind)
    .with('risk', () => Icon.Alert)
    .with('pr', () => Icon.Branch)
    .with('build', () => Icon.Terminal)
    .with('analysis', () => Icon.Net)
    .with('tip', () => Icon.Bulb)
    .exhaustive();
  return <I className="h-3.5 w-3.5" />;
}

function runAction(action: NotificationAction): void {
  match(action)
    .with({ kind: 'open-overlay' }, ({ overlayKey, payload }) => {
      const openOverlay = useUiStore.getState().openOverlay as (
        key: string,
        state?: Record<string, unknown>,
      ) => void;
      openOverlay(overlayKey, payload);
    })
    .with({ kind: 'open-route' }, ({ routeId }) => {
      toast(`Open route: ${routeId}`);
    })
    .with({ kind: 'toast' }, ({ message }) => {
      toast(message);
    })
    .with({ kind: 'noop' }, () => {})
    .exhaustive();
}

function formatRelative(at: number, now: number): string {
  const diff = Math.max(0, now - at);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface RowProps {
  n: Notification;
  now: number;
  onMarkRead(id: string): void;
}

function NotificationRow({ n, now, onMarkRead }: RowProps) {
  const handleOpen = () => {
    if (!n.read) onMarkRead(n.id);
    if (n.action) {
      runAction(n.action.run);
    } else {
      toast(`Open: ${n.title}`);
    }
  };
  return (
    <li
      className={cn(
        'group relative flex items-start gap-2 px-3 py-2 hairline-b transition-colors',
        !n.read && 'bg-bg-selected',
        n.read && 'text-ink-2',
      )}
    >
      {!n.read && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[2px] bg-accent"
        />
      )}
      <div
        className={cn(
          'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-line bg-bg',
          n.read ? 'text-ink-3' : 'text-ink-1',
        )}
        aria-hidden
      >
        <KindIcon kind={n.kind} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Chip size="xs" tone={kindTone(n.kind)}>
            {KIND_LABEL[n.kind]}
          </Chip>
          <span
            className={cn(
              'truncate text-sm font-medium',
              n.read ? 'text-ink-2' : 'text-ink-1',
            )}
          >
            {n.title}
          </span>
        </div>
        {n.body ? (
          <div className="mt-0.5 text-xs text-ink-3">{n.body}</div>
        ) : null}
        <div className="mt-1 text-[11px] text-ink-3">{formatRelative(n.at, now)}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Button size="xs" tone="ghost" onClick={handleOpen}>
          {n.action?.label ?? 'Open'}
        </Button>
        {!n.read && (
          <button
            type="button"
            onClick={() => onMarkRead(n.id)}
            className="text-[11px] text-ink-3 hover:text-accent"
          >
            mark read
          </button>
        )}
      </div>
    </li>
  );
}

export function NotificationsOverlay() {
  const open = useUiStore((s) => s.overlays.notifications.open);
  const close = useUiStore((s) => s.closeOverlay);
  const list = useNotificationStore((s) => s.list);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const now = useMemo(() => Date.now(), []);

  const { today, earlier } = useMemo(() => {
    const t: Notification[] = [];
    const e: Notification[] = [];
    for (const n of list) {
      if (now - n.at < ONE_DAY) t.push(n);
      else e.push(n);
    }
    return { today: t, earlier: e };
  }, [list, now]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('notifications'))}
      title={
        <span className="flex items-center gap-2">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Chip size="xs" tone="accent">
              {unreadCount} unread
            </Chip>
          )}
        </span>
      }
      subtitle="risks · PRs · builds · analysis"
      width={560}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs text-ink-3">{list.length} total</span>
          <Button
            size="xs"
            tone="soft"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
      }
    >
      <div className="flex flex-col">
        {list.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No notifications"
              description="You'll see project risks, PR updates, and build notes here."
              icon={<Bell className="h-4 w-4" />}
            />
          </div>
        ) : (
          <>
            <SectionHeader title="Today" count={today.length} />
            {today.length === 0 ? (
              <div className="px-3 py-2 text-xs text-ink-3">No new notifications.</div>
            ) : (
              <ul>
                {today.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    now={now}
                    onMarkRead={markRead}
                  />
                ))}
              </ul>
            )}
            <SectionHeader title="Earlier" count={earlier.length} />
            {earlier.length === 0 ? (
              <div className="px-3 py-2 text-xs text-ink-3">Nothing older.</div>
            ) : (
              <ul>
                {earlier.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    now={now}
                    onMarkRead={markRead}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </OverlayPanel>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 hairline-b bg-bg-subtle">
      <span className="text-caps text-ink-3">{title}</span>
      <span className="text-[11px] text-ink-3">{count}</span>
    </div>
  );
}

export function NotificationsBell() {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const tooltipLabel =
    unreadCount > 0
      ? `Notifications (${unreadCount} unread)`
      : 'Notifications';
  return (
    <Tooltip content={tooltipLabel}>
      <Button
        size="icon"
        tone="ghost"
        aria-label={tooltipLabel}
        className="relative"
        onClick={() => openOverlay('notifications')}
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className={cn(
              'absolute -right-0.5 -top-0.5 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full',
              'bg-accent px-1 text-[9px] font-semibold leading-none text-white',
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </Tooltip>
  );
}
