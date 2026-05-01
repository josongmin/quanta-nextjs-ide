import { useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  COMPONENTS,
  STATES,
  VIEWPORTS,
  describeState,
  type ComponentEntry,
  type PreviewState,
  type Viewport,
} from './helpers';

export function ComponentPreviewOverlay() {
  const open = useUiStore((s) => s.overlays.componentPreview.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [selectedId, setSelectedId] = useState<string>('product-card');
  const [state, setState] = useState<PreviewState>('normal');
  const [viewport, setViewport] = useState<Viewport>(VIEWPORTS[2]!);
  const [theme, setTheme] = useState<'light' | 'light-hc'>('light');
  const [showGuides, setShowGuides] = useState(false);

  const component = COMPONENTS.find((c) => c.id === selectedId) ?? COMPONENTS[0]!;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('componentPreview'))}
      title="Component Preview"
      subtitle={`${component.name} · ${component.kind} · ${describeState(state)}`}
      size="lg"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Generate snapshot (preview)')}>
            <Icon.File className="h-3 w-3" />
            Generate snapshot
          </Button>
          <Button size="xs" tone="default" onClick={() => toast(`Open ${component.file} in editor`)}>
            <Icon.UpRight className="h-3 w-3" />
            Open in editor
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {COMPONENTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {STATES.map((s) => (
            <button
              key={s.id}
              onClick={() => setState(s.id)}
              aria-selected={state === s.id}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                state === s.id && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="ml-2 inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
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

        <button
          onClick={() => setShowGuides((v) => !v)}
          aria-pressed={showGuides}
          className={cn(
            'h-5 rounded-full border px-2 text-[10px] tracking-caps',
            showGuides
              ? 'border-accent/30 bg-accent-soft text-accent'
              : 'border-line bg-bg text-ink-3 hover:text-ink-1',
          )}
        >
          Guides
        </button>

        <span className="ml-auto text-[10px] text-ink-3">
          {viewport.width}px
        </span>
      </div>

      {/* Body — preview + meta */}
      <div className="grid grid-cols-[1fr_300px]">
        <div className="flex min-h-[480px] items-start justify-center overflow-auto bg-bg-subtle p-6">
          <div
            className={cn(
              'overflow-hidden rounded-md border border-line bg-bg shadow-pop',
              showGuides && 'outline outline-1 outline-accent/40',
            )}
            style={{ width: Math.min(viewport.width, 920) }}
          >
            <PreviewSurface component={component} state={state} />
          </div>
        </div>

        <div className="hairline-l bg-bg">
          <div className="px-3 py-3 hairline-b">
            <div className="text-caps text-ink-3">Component</div>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink-1">
              <span>{component.name}</span>
              <Chip tone={component.kind === 'client' ? 'client' : 'server'} size="xs">
                {component.kind}
              </Chip>
            </div>
            <div className="mt-1 text-[11px] text-ink-3">{component.file}</div>
            <p className="mt-2 text-xs text-ink-2">{component.description}</p>
          </div>
          <div className="px-3 py-3 hairline-b">
            <div className="text-caps text-ink-3">Props</div>
            {component.props.length === 0 ? (
              <div className="mt-1 text-xs text-ink-3">— none —</div>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {component.props.map((p) => (
                  <li key={p} className="font-mono text-[11px] text-ink-2">
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-3 py-3 hairline-b">
            <div className="text-caps text-ink-3">Hooks</div>
            {component.hooks.length === 0 ? (
              <div className="mt-1 text-xs text-ink-3">— none —</div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1">
                {component.hooks.map((h) => (
                  <Chip key={h} tone="muted" size="xs">
                    <span className="font-mono">{h}</span>
                  </Chip>
                ))}
              </div>
            )}
          </div>
          <div className="px-3 py-3">
            <div className="text-caps text-ink-3">State</div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-xs">
              <Chip
                tone={state === 'error' || state === 'not-found' ? 'err' : state === 'unauthorized' ? 'warn' : 'muted'}
                size="xs"
              >
                {state}
              </Chip>
              <span className="text-ink-3">{describeState(state)}</span>
            </div>
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}

function PreviewSurface({
  component,
  state,
}: {
  component: ComponentEntry;
  state: PreviewState;
}) {
  if (state === 'loading') {
    return (
      <div className="space-y-2 p-6">
        <div className="h-6 w-1/3 animate-pulse rounded-sm bg-line/40" />
        <div className="h-32 w-full animate-pulse rounded-md bg-line/40" />
        <div className="h-4 w-1/2 animate-pulse rounded-sm bg-line/40" />
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center gap-2 p-12 text-sev-err">
        <Icon.Alert className="h-8 w-8" />
        <div className="text-sm font-medium">Something went wrong</div>
        <div className="text-xs text-ink-3">Reset boundary to try again</div>
        <button className="mt-2 rounded-sm border border-sev-err/30 bg-sev-err-soft px-2 py-1 text-xs text-sev-err">
          Reset
        </button>
      </div>
    );
  }
  if (state === 'not-found') {
    return (
      <div className="flex flex-col items-center gap-2 p-12 text-ink-3">
        <Icon.X className="h-8 w-8" />
        <div className="text-sm font-medium text-ink-2">Not found</div>
        <div className="text-xs">No record matched this id</div>
      </div>
    );
  }
  if (state === 'empty') {
    return (
      <div className="flex flex-col items-center gap-2 p-12 text-ink-3">
        <Icon.Box className="h-8 w-8" />
        <div className="text-sm font-medium text-ink-2">Empty</div>
        <div className="text-xs">No items yet</div>
      </div>
    );
  }
  if (state === 'unauthorized') {
    return (
      <div className="flex flex-col items-center gap-2 p-12 text-sev-warn">
        <Icon.Lock className="h-8 w-8" />
        <div className="text-sm font-medium">Sign in required</div>
        <button className="mt-2 rounded-sm border border-sev-warn/30 bg-sev-warn-soft px-2 py-1 text-xs">
          Sign in
        </button>
      </div>
    );
  }

  // Normal state — stylized mock per component
  switch (component.id) {
    case 'product-card':
      return (
        <div className="grid grid-cols-2 gap-4 p-6">
          <div className="aspect-square rounded-md bg-bg-subtle" />
          <div className="flex flex-col gap-2">
            <div className="text-md font-semibold text-ink-1">Mock Product</div>
            <div className="text-xs text-ink-3">Premium tier · in stock</div>
            <div className="text-md font-semibold text-ink-1">$249.00</div>
            <button className="mt-2 self-start rounded-sm border border-accent bg-accent px-3 py-1 text-xs text-white">
              Add to cart
            </button>
          </div>
        </div>
      );
    case 'add-to-cart':
      return (
        <div className="p-6">
          <button className="w-full rounded-sm border border-accent bg-accent px-4 py-2 text-sm font-medium text-white">
            Add to cart
          </button>
          <div className="mt-2 text-center text-[11px] text-ink-3">
            useFormStatus · useOptimistic
          </div>
        </div>
      );
    case 'user-menu':
      return (
        <div className="flex items-center justify-end p-4">
          <div className="flex items-center gap-2 rounded-full border border-line bg-bg-subtle px-3 py-1.5">
            <span className="inline-block h-5 w-5 rounded-full bg-accent" />
            <span className="text-xs text-ink-2">user@example.com</span>
            <Icon.ChevDown className="h-3 w-3 text-ink-3" />
          </div>
        </div>
      );
    case 'search-box':
      return (
        <div className="p-4">
          <div className="flex items-center gap-2 rounded-md border border-line bg-bg-subtle px-2 py-1.5">
            <Icon.Search className="h-3.5 w-3.5 text-ink-3" />
            <input
              readOnly
              placeholder="Search products"
              className="flex-1 bg-transparent text-xs text-ink-2 outline-none"
            />
          </div>
        </div>
      );
    case 'order-summary':
      return (
        <div className="space-y-2 p-6">
          <div className="flex justify-between text-xs text-ink-2">
            <span>Subtotal</span>
            <span className="font-mono">$249.00</span>
          </div>
          <div className="flex justify-between text-xs text-ink-2">
            <span>Tax</span>
            <span className="font-mono">$24.90</span>
          </div>
          <div className="hairline-t pt-2 flex justify-between text-sm font-medium text-ink-1">
            <span>Total</span>
            <span className="font-mono">$273.90</span>
          </div>
        </div>
      );
    case 'chart-panel':
      return (
        <div className="p-6">
          <div className="mb-2 text-sm font-medium text-ink-1">Revenue · 30d</div>
          <svg viewBox="0 0 240 80" className="h-24 w-full">
            <polyline
              points="0,60 30,50 60,55 90,40 120,42 150,30 180,35 210,20 240,25"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="1.5"
            />
            <polyline
              points="0,60 30,50 60,55 90,40 120,42 150,30 180,35 210,20 240,25 240,80 0,80"
              fill="hsl(var(--accent) / 0.1)"
            />
          </svg>
          <div className="mt-1 text-[10px] text-ink-3">recharts · 96KB est.</div>
        </div>
      );
    default:
      return (
        <div className="p-6 text-center text-xs text-ink-3">
          {component.name} preview
        </div>
      );
  }
}
