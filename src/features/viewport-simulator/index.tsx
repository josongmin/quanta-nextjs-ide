import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import type { Archetype } from '@shared/types';
import { Button, Chip, Icon, OverlayPanel, SeverityDot } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  BREAKPOINTS,
  VIEWPORTS,
  currentBreakpoint,
  issuesAt,
  type ViewportPreset,
} from './helpers';

export function ViewportSimulatorOverlay() {
  const open = useUiStore((s) => s.overlays.viewportSimulator.open);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);
  const focusedId = useUiStore((s) => s.overlays.viewportSimulator.routeId);

  const [routeId, setRouteId] = useState<string>(focusedId ?? routes[0]?.id ?? '');
  const [viewport, setViewport] = useState<ViewportPreset>(VIEWPORTS[3]!);
  const [zoom, setZoom] = useState(0.6);
  const [theme, setTheme] = useState<'light' | 'light-hc'>('light');

  const route = useMemo(
    () => routes.find((r) => r.id === routeId) ?? routes[0],
    [routes, routeId],
  );
  const issues = useMemo(
    () => (route ? issuesAt(viewport.width, route.archetype) : []),
    [viewport, route],
  );

  if (!route) return null;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('viewportSimulator'))}
      title="Viewport Simulator"
      subtitle={`${route.path} · ${viewport.label} · breakpoint: ${currentBreakpoint(viewport.width)}`}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Capture screenshot (preview)')}>
            Capture
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Compare two viewports (preview)')}>
            Compare
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() => toast(`Open ${route.files.page ?? route.path}`)}
          >
            <Icon.UpRight className="h-3 w-3" />
            Open route
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <select
          value={routeId}
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
        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {(['light', 'light-hc'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              aria-selected={theme === t}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                theme === t && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {t === 'light' ? 'light' : 'light HC'}
            </button>
          ))}
        </div>
        <div className="ml-auto inline-flex h-6 items-center gap-1 text-[10px] text-ink-3">
          zoom
          <input
            type="range"
            min={30}
            max={100}
            step={5}
            value={zoom * 100}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="h-3 w-24 accent-accent"
          />
          <span className="font-mono">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Ruler */}
      <div className="relative h-5 hairline-b bg-bg-subtle px-3 text-[9px] text-ink-3">
        {BREAKPOINTS.map((b) => (
          <span
            key={b.px}
            className="absolute top-0 flex h-full items-center"
            style={{ left: `${(b.px / 1920) * 100}%` }}
            aria-hidden
          >
            <span className="h-2 w-px bg-line" />
            <span className="ml-1 font-mono">{b.px}px · {b.label}</span>
          </span>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_240px]">
        <div className="flex justify-center overflow-auto bg-bg-subtle p-6" style={{ maxHeight: '60vh' }}>
          <div
            className="rounded-md border border-line bg-bg shadow-pop overflow-hidden"
            style={{
              width: viewport.width * zoom,
              height: viewport.height * zoom,
              transformOrigin: 'top left',
            }}
          >
            <ArchetypeMockup archetype={route.archetype} />
          </div>
        </div>

        <aside className="hairline-l bg-bg">
          <div className="px-3 py-2 hairline-b">
            <div className="text-caps text-ink-3">Breakpoint</div>
            <div className="mt-1 font-mono text-sm text-ink-1">
              {currentBreakpoint(viewport.width)}
            </div>
            <div className="text-[11px] text-ink-3">
              {viewport.width} × {viewport.height}px
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-caps text-ink-3">
              Issues at this viewport ({issues.length})
            </div>
            <ul className="mt-1.5 space-y-2">
              {issues.map((iss, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <SeverityDot severity={iss.severity} />
                  <div className="min-w-0">
                    <div className="text-ink-1">{iss.title}</div>
                    <div className="text-[11px] text-ink-3">{iss.hint}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
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
        <Chip tone="muted" size="xs">{archetype}</Chip>
      </div>
    ));
}
