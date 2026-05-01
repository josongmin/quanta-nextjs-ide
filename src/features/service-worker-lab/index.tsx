import { useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  cacheBuckets,
  push,
  registration,
  syncQueue,
  totalCacheBytes,
} from './helpers';

const STATES: ReadonlyArray<{ id: string; label: string; x: number; y: number }> = [
  { id: 'install', label: 'install', x: 60, y: 50 },
  { id: 'wait', label: 'wait', x: 200, y: 50 },
  { id: 'activate', label: 'activate', x: 340, y: 50 },
  { id: 'idle', label: 'idle', x: 480, y: 50 },
];

const ACTIVE_NODE_FOR: Record<string, string> = {
  installing: 'install',
  installed: 'install',
  waiting: 'wait',
  active: 'idle',
  redundant: 'idle',
};

export function ServiceWorkerLabOverlay() {
  const open = useUiStore((s) => s.overlays.serviceWorkerLab.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [bucketName, setBucketName] = useState<string>(
    cacheBuckets[0]?.name ?? '',
  );

  const activeNode = ACTIVE_NODE_FOR[registration.state] ?? 'idle';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('serviceWorkerLab'))}
      title="Service Worker lab"
      subtitle={`${registration.scriptURL} · scope ${registration.scope}`}
      size="xl"
    >
      <Tabs defaultValue="lifecycle" className="flex flex-col">
        <TabsList className="h-9 px-3">
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="caches">Caches</TabsTrigger>
          <TabsTrigger value="push">Push</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="lifecycle" className="p-4">
          <div className="grid grid-cols-[1fr_280px] gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                State machine
              </div>
              <svg
                width={560}
                height={120}
                viewBox="0 0 560 120"
                className="mt-2"
                role="img"
                aria-label="service worker lifecycle"
              >
                {STATES.map((s, i) => {
                  const next = STATES[i + 1];
                  return next ? (
                    <line
                      key={`l-${s.id}`}
                      x1={s.x + 28}
                      y1={s.y}
                      x2={next.x - 28}
                      y2={next.y}
                      stroke="rgb(0 0 0 / 0.25)"
                      strokeWidth={1}
                      markerEnd="url(#arrow-sw)"
                    />
                  ) : null;
                })}
                <defs>
                  <marker
                    id="arrow-sw"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill="rgb(0 0 0 / 0.4)" />
                  </marker>
                </defs>
                {STATES.map((s) => {
                  const isActive = activeNode === s.id;
                  return (
                    <g key={s.id}>
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={26}
                        fill={isActive ? 'rgb(99 102 241 / 0.18)' : 'white'}
                        stroke={
                          isActive
                            ? 'rgb(99 102 241)'
                            : 'rgb(0 0 0 / 0.15)'
                        }
                        strokeWidth={isActive ? 2 : 1}
                      />
                      <text
                        x={s.x}
                        y={s.y + 4}
                        textAnchor="middle"
                        fontSize={11}
                        fontFamily="ui-monospace, monospace"
                        fill="rgb(17 24 39)"
                      >
                        {s.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="mt-3 flex gap-1.5">
                <Button size="xs" tone="default" onClick={() => toast('Update checked')}>
                  Update
                </Button>
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => toast('Skip waiting → active')}
                >
                  Skip waiting
                </Button>
                <Button size="xs" tone="warn" onClick={() => toast('Unregistered')}>
                  Unregister
                </Button>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Registration
              </div>
              <ul className="mt-1 divide-y divide-line rounded-sm border border-line bg-bg">
                <li className="flex items-center justify-between px-2 py-1 text-[11px]">
                  <span className="font-mono text-ink-3">state</span>
                  <Chip
                    tone={registration.state === 'active' ? 'static' : 'warn'}
                    size="xs"
                  >
                    {registration.state}
                  </Chip>
                </li>
                <li className="flex items-center justify-between px-2 py-1 text-[11px]">
                  <span className="font-mono text-ink-3">version</span>
                  <span className="font-mono text-ink-1">{registration.version}</span>
                </li>
                <li className="flex items-center justify-between px-2 py-1 text-[11px]">
                  <span className="font-mono text-ink-3">clients</span>
                  <span className="font-mono text-ink-1">
                    {registration.controlledClients}
                  </span>
                </li>
                <li className="flex items-center justify-between px-2 py-1 text-[11px]">
                  <span className="font-mono text-ink-3">last update</span>
                  <span className="font-mono text-ink-1">
                    {registration.lastUpdateCheck}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="caches" className="p-4">
          <div className="grid grid-cols-[260px_1fr] gap-3">
            <ul className="space-y-1">
              {cacheBuckets.map((b) => {
                const total = b.entries.reduce((a, e) => a + e.bytes, 0);
                return (
                  <li key={b.name}>
                    <button
                      type="button"
                      onClick={() => setBucketName(b.name)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-sm border px-2 py-1.5 text-left text-[11px]',
                        bucketName === b.name
                          ? 'border-accent/40 bg-accent-soft'
                          : 'border-line bg-bg hover:bg-bg-hover',
                      )}
                    >
                      <span className="font-mono">{b.name}</span>
                      <span className="text-ink-3">
                        {b.entries.length} · {(total / 1024).toFixed(1)}KB
                      </span>
                    </button>
                  </li>
                );
              })}
              <li className="px-2 py-1 text-[10px] text-ink-3">
                total {(totalCacheBytes() / 1024).toFixed(1)} KB
              </li>
            </ul>
            <table className="w-full text-[11px]">
              <thead className="bg-bg-subtle text-ink-3">
                <tr>
                  <th className="px-2 py-1 text-left">URL</th>
                  <th className="px-2 py-1 text-left">method</th>
                  <th className="px-2 py-1 text-left">status</th>
                  <th className="px-2 py-1 text-right">size</th>
                  <th className="px-2 py-1" />
                </tr>
              </thead>
              <tbody>
                {(cacheBuckets.find((b) => b.name === bucketName)?.entries ?? []).map(
                  (e) => (
                    <tr key={e.url} className="border-t border-line">
                      <td className="px-2 py-1 font-mono text-ink-1">{e.url}</td>
                      <td className="px-2 py-1 font-mono text-ink-3">{e.method}</td>
                      <td className="px-2 py-1 font-mono text-ink-3">{e.status}</td>
                      <td className="px-2 py-1 text-right font-mono text-ink-3">
                        {(e.bytes / 1024).toFixed(1)}KB
                      </td>
                      <td className="px-2 py-1">
                        <Button
                          size="xs"
                          tone="ghost"
                          onClick={() => toast(`Removed ${e.url}`)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="push" className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Subscription
              </div>
              <ul className="mt-1 divide-y divide-line rounded-sm border border-line bg-bg text-[11px]">
                <li className="flex items-center justify-between px-2 py-1">
                  <span className="font-mono text-ink-3">status</span>
                  <Chip tone={push.active ? 'static' : 'muted'} size="xs">
                    {push.active ? 'subscribed' : 'idle'}
                  </Chip>
                </li>
                <li className="flex items-center justify-between gap-2 px-2 py-1">
                  <span className="font-mono text-ink-3">endpoint</span>
                  <span className="font-mono text-ink-1 truncate max-w-[260px]">
                    {push.endpoint}
                  </span>
                </li>
                <li className="px-2 py-1">
                  <span className="font-mono text-ink-3">VAPID key</span>
                  <pre className="mt-1 overflow-auto rounded-sm bg-bg-subtle p-1 font-mono text-[10px] text-ink-1">
                    {push.vapidKey}
                  </pre>
                </li>
              </ul>
              <div className="mt-2 flex gap-1.5">
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => toast('Test push delivered')}
                >
                  Send test push
                </Button>
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => toast('Unsubscribed')}
                >
                  Unsubscribe
                </Button>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Recent notifications
              </div>
              <ul className="mt-1 space-y-1">
                {push.notifications.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1 text-[11px]"
                  >
                    <span className="text-ink-1">{n.title}</span>
                    <span className="font-mono text-ink-3">{n.ts}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sync" className="p-4">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Background sync queue
          </div>
          <ul className="mt-2 space-y-1.5">
            {syncQueue.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-sm border border-line bg-bg px-2 py-1.5 text-[11px]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ink-1">{t.tag}</span>
                    <Chip tone={t.retries > 1 ? 'warn' : 'muted'} size="xs">
                      {t.retries} retr{t.retries === 1 ? 'y' : 'ies'}
                    </Chip>
                  </div>
                  <div className="font-mono text-[10px] text-ink-3 truncate">
                    {t.payload}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-ink-3">
                    next {t.nextAttemptIn}
                  </span>
                  <Button
                    size="xs"
                    tone="ghost"
                    onClick={() => toast(`Retried ${t.tag}`)}
                  >
                    Retry
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </OverlayPanel>
  );
}
