import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useActionStore } from '@entities/server-action';
import { useCacheTagStore } from '@entities/cache-tag';
import { useRouteStore } from '@entities/route';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  bucketize,
  findActionReferences,
  findRouteReferences,
  findSymbolReferences,
  findTagReferences,
  shortFile,
  type ReferenceBucket,
  type ReferenceItem,
  type ReferenceKind,
} from './helpers';

const KIND_LABELS: Record<ReferenceKind, string> = {
  route: 'Route',
  tag: 'Cache tag',
  action: 'Server action',
  symbol: 'Symbol',
};

const KIND_TONES: Record<ReferenceKind, 'accent' | 'static' | 'isr' | 'dynamic'> = {
  route: 'accent',
  tag: 'static',
  action: 'isr',
  symbol: 'dynamic',
};

export function FindReferencesOverlay() {
  const open = useUiStore((s) => s.overlays.findReferences.open);
  const symbol = useUiStore((s) => s.overlays.findReferences.symbol);
  const kind = useUiStore((s) => s.overlays.findReferences.kind) ?? 'symbol';
  const close = useUiStore((s) => s.closeOverlay);

  const routes = useRouteStore((s) => s.routes);
  const tags = useCacheTagStore((s) => s.tags);
  const actions = useActionStore((s) => s.actions);
  const openTab = useEditorStore((s) => s.openTab);

  const items = useMemo<ReferenceItem[]>(() => {
    if (!symbol) return [];
    if (kind === 'route') {
      return findRouteReferences(symbol, routes);
    }
    if (kind === 'tag') {
      const tag =
        tags.find((t) => t.name === symbol) ??
        tags.find((t) => t.id === symbol);
      if (!tag) return [];
      return findTagReferences(tag);
    }
    if (kind === 'action') {
      const action =
        actions.find((a) => a.name === symbol) ??
        actions.find((a) => a.id === symbol);
      if (!action) return [];
      return findActionReferences(action);
    }
    return findSymbolReferences(symbol);
  }, [symbol, kind, routes, tags, actions]);

  const buckets = useMemo<ReferenceBucket[]>(
    () => bucketize(kind, items),
    [kind, items],
  );

  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const visibleBuckets = useMemo(
    () =>
      activeGroup
        ? buckets.filter((b) => b.group === activeGroup)
        : buckets.filter((b) => b.items.length > 0),
    [activeGroup, buckets],
  );

  const handleOpen = (item: ReferenceItem) => {
    openTab({
      id: `tab-${item.file}`,
      file: item.file,
      label: shortFile(item.file),
    });
    toast('Opened reference', {
      description: `${item.file}:${item.line}`,
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('findReferences'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Search className="h-4 w-4 text-ink-3" />
          <span>Find References</span>
          <Chip tone={KIND_TONES[kind]} size="sm">
            {KIND_LABELS[kind]}
          </Chip>
          {symbol ? (
            <span className="font-mono text-xs text-ink-2 truncate max-w-[280px]">
              {symbol}
            </span>
          ) : null}
        </span>
      }
      subtitle={`${items.length} reference${items.length === 1 ? '' : 's'} · grouped by kind`}
      size="md"
    >
      <div className="grid grid-cols-[1fr_220px] divide-x divide-line">
        <div className="min-w-0">
          <div className="flex items-center gap-2 px-4 py-2 hairline-b bg-bg-subtle">
            <span className="text-caps text-ink-3">Results</span>
            <span className="ml-auto text-[11px] text-ink-3">
              limited to top 30
            </span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {symbol ? null : (
              <div className="flex h-32 items-center justify-center text-xs text-ink-3">
                No symbol selected
              </div>
            )}
            {symbol && items.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-xs text-ink-3">
                No references found.
              </div>
            ) : null}
            {visibleBuckets.map((bucket) =>
              bucket.items.length === 0 ? null : (
                <div key={bucket.group} className="hairline-b last:border-b-0">
                  <header className="flex items-center justify-between gap-2 px-4 py-1.5 bg-bg-subtle">
                    <h3 className="text-caps text-ink-3">{bucket.label}</h3>
                    <Chip tone="muted" size="xs">
                      {bucket.items.length}
                    </Chip>
                  </header>
                  <ul>
                    {bucket.items.map((item) => (
                      <ReferenceRow
                        key={item.id}
                        item={item}
                        onOpen={() => handleOpen(item)}
                      />
                    ))}
                  </ul>
                </div>
              ),
            )}
          </div>
        </div>

        <aside className="min-w-0 px-3 py-3">
          <header className="mb-2 text-caps text-ink-3">Filter</header>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveGroup(null)}
                className={cn(
                  'w-full rounded-sm border px-2 py-1 text-left text-xs',
                  activeGroup === null
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                )}
              >
                All ({items.length})
              </button>
            </li>
            {buckets
              .filter((b) => b.items.length > 0)
              .map((b) => (
                <li key={b.group}>
                  <button
                    onClick={() =>
                      setActiveGroup(activeGroup === b.group ? null : b.group)
                    }
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm border px-2 py-1 text-left text-xs',
                      activeGroup === b.group
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                    )}
                  >
                    <span>{b.label}</span>
                    <span className="text-[10px] text-ink-3">{b.items.length}</span>
                  </button>
                </li>
              ))}
          </ul>

          <div className="mt-3 hairline-t pt-3">
            <Button
              size="sm"
              tone="ghost"
              className="w-full"
              onClick={() =>
                toast('Replace all (mock)', {
                  description: `Would queue ${items.length} replacements`,
                })
              }
            >
              <Icon.Refresh className="h-3 w-3" /> Replace all
            </Button>
            <p className="mt-2 text-[11px] text-ink-3">
              Click a row to open in editor. Use filter chips to narrow by group.
            </p>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function ReferenceRow({
  item,
  onOpen,
}: {
  item: ReferenceItem;
  onOpen(): void;
}) {
  return (
    <li>
      <button
        onClick={onOpen}
        className="flex w-full items-start gap-2 px-4 py-1.5 text-left hover:bg-bg-hover"
      >
        <Icon.File className="mt-0.5 h-3 w-3 shrink-0 text-ink-3" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="truncate font-mono text-[12px] text-ink-1">
              {item.file}
            </span>
            <span className="text-[11px] text-ink-3">:{item.line}</span>
          </div>
          <pre className="mt-0.5 truncate font-mono text-[11px] text-ink-2">
            {item.preview}
          </pre>
        </div>
        <Icon.UpRight className="mt-0.5 h-3 w-3 shrink-0 text-ink-3" />
      </button>
    </li>
  );
}
