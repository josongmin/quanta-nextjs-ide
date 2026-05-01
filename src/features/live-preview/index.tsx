import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import type { Archetype } from '@shared/types';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface ViewportPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

const VIEWPORTS: ViewportPreset[] = [
  { id: 'mobile', label: 'Mobile', width: 390, height: 720 },
  { id: 'tablet', label: 'Tablet', width: 820, height: 720 },
  { id: 'desktop', label: 'Desktop', width: 1280, height: 720 },
  { id: 'wide', label: 'Wide', width: 1920, height: 720 },
];

interface ConsoleEntry {
  ts: string;
  tag: 'GET' | 'POST' | 'render' | 'hydrate' | 'fetch' | 'cache';
  message: string;
}

function makeConsole(routePath: string): ConsoleEntry[] {
  const stamp = (offset: number): string => {
    const d = new Date(Date.now() - offset);
    return d.toISOString().slice(11, 19);
  };
  return [
    { ts: stamp(800), tag: 'GET', message: `${routePath} 200 · 84ms` },
    { ts: stamp(720), tag: 'cache', message: 'tag:products HIT (rev 60s)' },
    { ts: stamp(680), tag: 'fetch', message: 'getProduct(id) · 12ms' },
    { ts: stamp(620), tag: 'fetch', message: 'getReviews(id) · 18ms' },
    { ts: stamp(560), tag: 'render', message: 'Page · 12ms' },
    { ts: stamp(500), tag: 'render', message: 'ProductDetail · 4ms' },
    { ts: stamp(440), tag: 'hydrate', message: 'AddToCart · 4ms' },
    { ts: stamp(380), tag: 'hydrate', message: 'ReviewsList · 6ms' },
    { ts: stamp(310), tag: 'GET', message: '/api/cart 200 · 22ms' },
  ];
}

function tagTone(tag: ConsoleEntry['tag']): string {
  return match(tag)
    .with('GET', () => 'text-sem-static')
    .with('POST', () => 'text-sem-dynamic')
    .with('render', () => 'text-accent')
    .with('hydrate', () => 'text-sem-client')
    .with('fetch', () => 'text-ink-2')
    .with('cache', () => 'text-sem-isr')
    .exhaustive();
}

function ArchetypeMockup({ archetype }: { archetype: Archetype }) {
  return match(archetype)
    .with('marketing', () => (
      <div className="space-y-3 p-6">
        <div className="text-2xl font-bold text-ink-1">Build the future</div>
        <div className="text-sm text-ink-2">A short marketing pitch.</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="aspect-square rounded-md bg-bg-subtle" />
          <div className="aspect-square rounded-md bg-bg-subtle" />
          <div className="aspect-square rounded-md bg-bg-subtle" />
        </div>
      </div>
    ))
    .with('commerce.product-detail', () => (
      <div className="grid grid-cols-2 gap-4 p-6">
        <div className="aspect-square rounded-md bg-bg-subtle" />
        <div className="space-y-2">
          <div className="text-md font-semibold text-ink-1">Mock Product</div>
          <div className="text-xs text-ink-3">Premium · in stock</div>
          <div className="text-md font-semibold">$249</div>
          <button className="rounded-sm border border-accent bg-accent px-3 py-1 text-xs text-white">
            Add to cart
          </button>
        </div>
      </div>
    ))
    .with('commerce.checkout', () => (
      <div className="space-y-3 p-6">
        <div className="text-md font-semibold text-ink-1">Checkout</div>
        <div className="space-y-2">
          <div className="h-8 rounded-sm border border-line bg-bg-subtle" />
          <div className="h-8 rounded-sm border border-line bg-bg-subtle" />
          <div className="h-8 rounded-sm border border-line bg-bg-subtle" />
        </div>
        <button className="w-full rounded-sm border border-accent bg-accent px-3 py-2 text-xs text-white">
          Pay $273.90
        </button>
      </div>
    ))
    .with('dashboard', () => (
      <div className="space-y-3 p-6">
        <div className="text-md font-semibold text-ink-1">Dashboard</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 rounded-md bg-bg-subtle" />
          <div className="h-12 rounded-md bg-bg-subtle" />
          <div className="h-12 rounded-md bg-bg-subtle" />
        </div>
        <div className="h-32 rounded-md border border-line bg-bg-subtle" />
      </div>
    ))
    .with('admin', () => (
      <div className="p-6">
        <div className="mb-3 text-md font-semibold text-ink-1">Admin</div>
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 rounded-sm border border-line bg-bg-subtle" />
          ))}
        </div>
      </div>
    ))
    .with('blog', () => (
      <div className="p-6">
        <div className="text-xl font-bold text-ink-1">Blog post title</div>
        <div className="mt-2 text-xs text-ink-3">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </div>
        <div className="mt-3 space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded-sm bg-bg-subtle" />
          ))}
        </div>
      </div>
    ))
    .otherwise(() => (
      <div className="flex h-full items-center justify-center p-6 text-xs text-ink-3">
        <Chip tone="muted" size="xs">
          {archetype}
        </Chip>
      </div>
    ));
}

export function LivePreviewOverlay() {
  const open = useUiStore((s) => s.overlays.livePreview.open);
  const focusedRouteId = useUiStore((s) => s.overlays.livePreview.routeId);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);

  const [routeId, setRouteId] = useState<string>(
    focusedRouteId ?? routes[0]?.id ?? '',
  );
  const [viewport, setViewport] = useState<ViewportPreset>(VIEWPORTS[2]!);
  const [reloadKey, setReloadKey] = useState(0);

  const route = useMemo(
    () => routes.find((r) => r.id === routeId) ?? routes[0],
    [routes, routeId],
  );
  const consoleEntries = useMemo(
    // reloadKey is the refresh trigger even though it isn't read.
    () => (route ? makeConsole(route.path) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route, reloadKey],
  );

  if (!route) return null;

  // Cap the rendered viewport so it always fits inside the overlay.
  const maxFrameWidth = 760;
  const maxFrameHeight = 460;
  const scale = Math.min(
    maxFrameWidth / viewport.width,
    maxFrameHeight / viewport.height,
    1,
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('livePreview'))}
      title="Live Preview"
      subtitle="render the route in a sandbox"
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast(`Open ${route.path}`)}>
            Open route
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Capture screenshot (preview)')}>
            <Icon.Doc className="h-3 w-3" />
            Capture
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast('Open inspector (preview)')}>
            <Icon.Search className="h-3 w-3" />
            Open inspector
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <select
          value={route.id}
          onChange={(e) => setRouteId(e.target.value)}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.path}
            </option>
          ))}
        </select>
        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setViewport(v)}
              aria-selected={viewport.id === v.id}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                viewport.id === v.id && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-bg px-2 text-[11px] text-ink-2 hover:bg-bg-hover hover:text-ink-1"
        >
          <Icon.Refresh className="h-3 w-3" />
          Reload
        </button>
        <span className="ml-auto font-mono text-[10px] text-ink-3">
          {viewport.width} × {viewport.height} · {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_300px]">
        <div
          className="flex items-start justify-center overflow-auto bg-bg-subtle p-6"
          style={{ minHeight: 480 }}
        >
          {/* Browser frame */}
          <div
            className="overflow-hidden rounded-md border border-line bg-bg shadow-pop"
            style={{
              width: viewport.width * scale,
              transformOrigin: 'top left',
            }}
          >
            {/* Window chrome */}
            <div className="flex h-7 items-center gap-2 border-b border-line bg-bg-subtle px-2">
              <span className="inline-flex gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-sev-err/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-sev-warn/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-sem-static/70" />
              </span>
              <div className="flex h-5 flex-1 items-center gap-1 rounded-sm border border-line bg-bg px-2 font-mono text-[10px] text-ink-2">
                <Icon.Lock className="h-2.5 w-2.5 text-ink-3" />
                <span className="truncate">localhost:3000{route.path}</span>
              </div>
              <Chip tone="muted" size="xs">
                {route.rendering}
              </Chip>
            </div>
            {/* Rendered surface */}
            <div
              className="bg-bg"
              style={{
                width: viewport.width * scale,
                height: viewport.height * scale,
                overflow: 'hidden',
              }}
              key={reloadKey}
            >
              <div
                style={{
                  width: viewport.width,
                  height: viewport.height,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <ArchetypeMockup archetype={route.archetype} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: console */}
        <aside className="flex max-h-[60vh] flex-col hairline-l bg-bg">
          <div className="flex h-7 items-center gap-2 hairline-b bg-bg-subtle px-2">
            <Icon.Terminal className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Console</span>
            <span className="ml-auto font-mono text-[10px] text-ink-3">
              {consoleEntries.length} events
            </span>
          </div>
          <ul className="min-h-0 flex-1 overflow-auto px-2 py-1.5 font-mono text-[11px]">
            {consoleEntries.map((e, i) => (
              <li key={i} className="flex items-start gap-1.5 py-0.5">
                <span className="text-ink-3">[{e.ts}]</span>
                <span className={cn('uppercase', tagTone(e.tag))}>{e.tag}</span>
                <span className="text-ink-1">{e.message}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
