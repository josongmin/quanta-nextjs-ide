import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  COOKIE_BEHAVIOR,
  DISABLE_DRAFT_HANDLER,
  DRAFT_ROUTES,
  ENABLE_DRAFT_HANDLER,
  effClass,
  effective,
  type DraftFetch,
} from './helpers';

function FetchRow({ fetch, draft }: { fetch: DraftFetch; draft: boolean }) {
  const opt = draft ? fetch.draftCache : fetch.prodCache;
  const eff = effective(opt, fetch.revalidate);
  const cls = effClass(eff);
  return (
    <li className={cn('flex items-center gap-2 rounded-sm border border-line px-2 py-1.5 text-[11px]', cls.bg)}>
      <span className={cn('rounded-sm px-1 font-mono text-[10px]', cls.tone)}>{cls.label}</span>
      <span className="truncate font-mono text-ink-1">{fetch.resource}</span>
      <span className="ml-auto font-mono text-[10px] text-ink-3">cache: {opt}</span>
      {fetch.revalidate !== undefined ? (
        <Chip tone="muted" size="xs">
          rev {fetch.revalidate}s
        </Chip>
      ) : null}
    </li>
  );
}

export function DraftModeVizOverlay() {
  const open = useUiStore((s) => s.overlays.draftModeViz.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [routeId, setRouteId] = useState<string>(() => DRAFT_ROUTES[0]!.id);
  const [draft, setDraft] = useState<boolean>(false);

  const route = useMemo(
    () => DRAFT_ROUTES.find((r) => r.id === routeId) ?? DRAFT_ROUTES[0]!,
    [routeId],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('draftModeViz')}
      title={
        <span className="flex items-center gap-2">
          <span>draftMode() visualizer</span>
          <Chip tone={route.consumesDraft ? 'accent' : 'muted'} size="xs">
            {route.consumesDraft ? 'consumes draftMode' : 'no draftMode'}
          </Chip>
        </span>
      }
      subtitle={`${route.path} · ${route.fetches.length} fetches`}
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            cookie: __prerender_bypass · {draft ? 'set' : 'unset'}
          </span>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('Opened app/api/draft/route.ts (mock)')}
          >
            Open route handler
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast.success('Draft URL', {
                description: '/api/draft?secret=•••&slug=hello-world',
              })
            }
          >
            Test draft URL
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
        <span className="text-caps text-ink-3">Route</span>
        <div className="flex flex-wrap items-center gap-1">
          {DRAFT_ROUTES.map((r) => (
            <ToggleChip key={r.id} active={r.id === routeId} onClick={() => setRouteId(r.id)}>
              <span className={cn(r.consumesDraft && 'text-accent')}>{r.path}</span>
            </ToggleChip>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDraft((v) => !v)}
          className={cn(
            'ml-auto inline-flex h-7 items-center gap-2 rounded-sm border px-3 text-xs font-medium transition-colors',
            draft
              ? 'border-accent bg-accent text-white shadow-pop'
              : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
          )}
          aria-pressed={draft}
        >
          <span
            aria-hidden
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              draft ? 'bg-white' : 'bg-ink-3',
            )}
          />
          draftMode {draft ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="min-w-0 max-h-[68vh] overflow-y-auto p-3">
          {/* Two-column compare */}
          <div className="grid grid-cols-2 gap-3">
            <section className={cn('rounded-sm border border-line p-2', !draft && 'ring-1 ring-accent/40')}>
              <header className="mb-2 flex items-center gap-2 text-caps text-ink-3">
                <span>Production</span>
                <Chip tone="static" size="xs">
                  cache as configured
                </Chip>
              </header>
              <ul className="space-y-1">
                {route.fetches.map((f) => (
                  <FetchRow key={f.id} fetch={f} draft={false} />
                ))}
              </ul>
            </section>
            <section className={cn('rounded-sm border border-line p-2', draft && 'ring-1 ring-accent/40')}>
              <header className="mb-2 flex items-center gap-2 text-caps text-ink-3">
                <span>Draft mode</span>
                <Chip tone="warn" size="xs">
                  override applied
                </Chip>
              </header>
              <ul className="space-y-1">
                {route.fetches.map((f) => (
                  <FetchRow key={f.id} fetch={f} draft={true} />
                ))}
              </ul>
            </section>
          </div>

          {/* Implications */}
          <header className="mb-2 mt-4 text-caps text-ink-3">Rendering implications</header>
          <div className="flex flex-wrap gap-1.5">
            <Chip tone={route.rerendersOnEachReq && draft ? 'warn' : 'muted'}>
              RSC rerenders per request: {route.rerendersOnEachReq && (draft || route.consumesDraft) ? 'yes' : 'no'}
            </Chip>
            <Chip tone={draft && route.cookieSet ? 'accent' : 'muted'}>
              cookie set: {draft && route.cookieSet ? 'yes' : 'no'}
            </Chip>
            <Chip tone={draft && route.bypassesCdnCache ? 'err' : 'muted'}>
              CDN bypass: {draft && route.bypassesCdnCache ? 'yes' : 'no'}
            </Chip>
            <Chip tone={route.consumesDraft ? 'info' : 'muted'}>
              consumes draftMode(): {route.consumesDraft ? 'yes' : 'no'}
            </Chip>
            <Chip tone="muted">
              static params ignored: {draft && route.consumesDraft ? 'yes' : 'no'}
            </Chip>
            <Chip tone="muted">runtime: nodejs</Chip>
          </div>

          <header className="mb-2 mt-4 text-caps text-ink-3">Effective cache mix</header>
          <div className="grid grid-cols-3 gap-2">
            {(['static', 'dynamic', 'no-store'] as const).map((e) => {
              const count = route.fetches.filter(
                (f) => effective(draft ? f.draftCache : f.prodCache, f.revalidate) === e,
              ).length;
              const cls = effClass(e);
              return (
                <div
                  key={e}
                  className={cn('rounded-sm border border-line px-2 py-2 text-center', cls.bg)}
                >
                  <div className={cn('text-caps', cls.tone)}>{cls.label}</div>
                  <div className="font-mono text-md text-ink-1">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right rail: snippets */}
        <aside className="min-w-0 max-h-[68vh] space-y-3 overflow-y-auto p-3">
          <section>
            <header className="mb-1 text-caps text-ink-3">Enable draftMode</header>
            <CodeBlock code={ENABLE_DRAFT_HANDLER} language="typescript" maxHeight={240} />
          </section>
          <section>
            <header className="mb-1 text-caps text-ink-3">Disable</header>
            <CodeBlock code={DISABLE_DRAFT_HANDLER} language="typescript" maxHeight={140} />
          </section>
          <section>
            <header className="mb-1 text-caps text-ink-3">Cookie behavior</header>
            <CodeBlock code={COOKIE_BEHAVIOR} language="http" maxHeight={200} />
          </section>
        </aside>
      </div>
    </OverlayPanel>
  );
}
