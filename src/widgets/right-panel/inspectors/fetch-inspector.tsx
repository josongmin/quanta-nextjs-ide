import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import {
  Button,
  Chip,
  ConfidenceDot,
  Inspector,
  RenderingChip,
  Section,
} from '@shared/ui';
import type { DataSource, Route } from '@shared/types';
import { EmptyState, KvRow } from '../parts';

interface Props {
  routeId: string;
  fetchId: string;
}

const cacheModeLabel = (mode: DataSource['cacheMode']): string =>
  match(mode)
    .with('default', () => 'default (force-cache)')
    .with('force-cache', () => 'force-cache')
    .with('no-store', () => 'no-store')
    .with('unset', () => 'unset')
    .exhaustive();

interface Suggestion {
  revalidate: number;
  tag: string;
  rationale: string;
}

const suggestFor = (route: Route, ds: DataSource | undefined): Suggestion | null => {
  if (!ds) return null;
  if (ds.cacheTags.includes('products') || route.cacheTags.includes('products')) {
    return {
      revalidate: 60,
      tag: 'products',
      rationale: 'data shape resembles a public product list',
    };
  }
  if (ds.kind === 'fetch' && route.archetype === 'commerce.product-detail') {
    return {
      revalidate: 60,
      tag: 'product:{id}',
      rationale: 'product detail surface — keyed invalidation recommended',
    };
  }
  return null;
};

export function FetchInspector({ routeId, fetchId }: Props) {
  const route = useRouteStore((s) => s.byId(routeId));
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);

  // The current data model exposes DataSource per route (not standalone fetches).
  // Fall back to the named/first data source for the route.
  const ds: DataSource | undefined =
    route?.dataSources.find((d) => d.id === fetchId) ?? route?.dataSources[0];

  if (!route || !ds) {
    return (
      <Inspector
        title="FETCH"
        meta={`${routeId}${fetchId ? ` · ${fetchId}` : ''}`}
        pinned={inspectorPinned}
        onTogglePin={togglePin}
      >
        <EmptyState>
          No fetch / data source found for this route.
        </EmptyState>
      </Inspector>
    );
  }

  const suggestion = suggestFor(route, ds);
  const tags = ds.cacheTags;

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <span className="text-caps text-[11px] uppercase text-ink-3">FETCH</span>
          <span className="font-mono text-sm text-ink-1">{ds.name}</span>
          <Chip tone="info" size="xs">
            {ds.kind}
          </Chip>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          <span className="text-ink-2">{route.path}</span>
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Cache --------------------------------------------------------- */}
      <Section title="Cache" defaultOpen>
        <div className="space-y-0">
          <KvRow label="Mode">
            <span className="font-mono text-xs text-ink-2">
              {cacheModeLabel(ds.cacheMode)}
            </span>
          </KvRow>
          <KvRow label="Revalidate">
            <span className="font-mono text-xs text-ink-2">
              {typeof ds.revalidate === 'number' ? `${ds.revalidate}s` : 'none'}
            </span>
          </KvRow>
          <KvRow label="Tags">
            {tags.length === 0 ? (
              <span className="text-xs text-ink-3">none</span>
            ) : (
              <span className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <Chip key={t} tone="info" size="xs">
                    <span className="font-mono">{t}</span>
                  </Chip>
                ))}
              </span>
            )}
          </KvRow>
        </div>
      </Section>

      {/* Recommendation ----------------------------------------------- */}
      <Section
        title={
          <span className="inline-flex items-center gap-1.5">
            <span>Recommendation</span>
            <span className="text-[11px] font-normal text-ink-3">
              (Confidence
            </span>
            <ConfidenceDot confidence="medium" />
            <span className="text-[11px] font-normal text-ink-3">Medium)</span>
          </span>
        }
        defaultOpen
      >
        {suggestion ? (
          <div className="space-y-1.5">
            <div className="text-xs text-ink-2">{suggestion.rationale}</div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-ink-3">suggested:</span>
              <Chip tone="isr" size="xs">
                <span className="font-mono">revalidate {suggestion.revalidate}</span>
              </Chip>
              <Chip tone="info" size="xs">
                <span className="font-mono">tag &quot;{suggestion.tag}&quot;</span>
              </Chip>
            </div>
            <Button
              size="xs"
              tone="accent"
              onClick={() =>
                toast(
                  `Apply: revalidate ${suggestion.revalidate}, tag "${suggestion.tag}" (preview)`,
                )
              }
            >
              Apply suggestion
            </Button>
          </div>
        ) : (
          <EmptyState>No recommendation — current policy looks fine.</EmptyState>
        )}
      </Section>

      {/* Pair check --------------------------------------------------- */}
      <Section title="Pair check" defaultOpen>
        <div className="text-xs text-ink-2">
          {tags.length === 0 ? (
            <>No invalidation pair to check (no tags set).</>
          ) : (
            <>
              No{' '}
              <span className="font-mono">
                revalidateTag(&quot;{tags[0] ?? 'products'}&quot;)
              </span>{' '}
              found in project.
            </>
          )}
        </div>
      </Section>

      {/* Inside ------------------------------------------------------- */}
      <Section title="Inside" defaultOpen={false}>
        <div className="space-y-0">
          <KvRow label="Component">
            <span className="inline-flex items-center gap-1.5 text-xs">
              <Chip tone="server" size="xs">
                Server
              </Chip>
              <span className="font-mono text-ink-2">
                {route.files.page ?? route.path}
              </span>
            </span>
          </KvRow>
          <KvRow label="Route">
            <span className="inline-flex items-center gap-1.5 text-xs">
              <RenderingChip
                rendering={route.rendering}
                confidence={route.renderingConfidence}
              />
              <span className="font-mono text-ink-2">{route.path}</span>
            </span>
          </KvRow>
          <KvRow label="Effect">
            <span className="text-xs text-ink-3">
              cache hit improves CDN egress
            </span>
          </KvRow>
        </div>
      </Section>
    </Inspector>
  );
}
