import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useDatabaseStore } from '@entities/database';
import type { ApiEndpoint, ApiEndpointKind, ApiHttpMethod } from '@shared/types';
import {
  Chip,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Icon,
  Tooltip,
} from '@shared/ui';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';
import { SearchInput } from '../parts/search-input';

type KindFilter = 'all' | ApiEndpointKind;
type RuntimeFilter = 'all' | 'edge' | 'node';

const KIND_OPTIONS: ReadonlyArray<FilterChipOption<KindFilter>> = [
  { value: 'all', label: 'All' },
  { value: 'handler', label: 'Handlers' },
  { value: 'action', label: 'Actions' },
  { value: 'trpc', label: 'tRPC' },
  { value: 'graphql', label: 'GQL' },
];

const RUNTIME_OPTIONS: ReadonlyArray<FilterChipOption<RuntimeFilter>> = [
  { value: 'all', label: 'all' },
  { value: 'edge', label: 'edge' },
  { value: 'node', label: 'node' },
];

const kindIcon = (kind: ApiEndpointKind) =>
  match(kind)
    .with('handler', () => <Icon.Globe className="h-3 w-3 text-sem-edge" />)
    .with('action', () => <Icon.Zap className="h-3 w-3 text-sem-server" />)
    .with('trpc', () => <Icon.Net className="h-3 w-3 text-accent" />)
    .with('graphql', () => <Icon.Hex className="h-3 w-3 text-sem-isr" />)
    .exhaustive();

const methodTone = (m: ApiHttpMethod) =>
  match(m)
    .with('GET', () => 'static' as const)
    .with('POST', () => 'info' as const)
    .with('PUT', () => 'isr' as const)
    .with('PATCH', () => 'isr' as const)
    .with('DELETE', () => 'err' as const)
    .exhaustive();

function EndpointContextMenu({
  endpoint,
  children,
}: {
  endpoint: ApiEndpoint;
  children: React.ReactNode;
}) {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const fire = (label: string) => () => toast(label, { description: endpoint.name });
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>{endpoint.kind}: {endpoint.name}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={fire('Open in editor')}>Open in editor</ContextMenuItem>
        <ContextMenuItem onSelect={fire('Show consumers')}>Show consumers</ContextMenuItem>
        <ContextMenuItem
          onSelect={() =>
            openOverlay('findReferences', { kind: 'symbol', symbol: endpoint.name })
          }
        >
          Find references
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={fire('Generate openapi.json fragment')}>
          Generate openapi.json
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function ApisTab() {
  const endpoints = useDatabaseStore((s) => s.endpoints);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const [kind, setKind] = useState<KindFilter>('all');
  const [runtime, setRuntime] = useState<RuntimeFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return endpoints.filter((e) => {
      if (kind !== 'all' && e.kind !== kind) return false;
      if (runtime !== 'all' && e.runtime !== runtime) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        (e.path ?? '').toLowerCase().includes(q) ||
        e.file.toLowerCase().includes(q)
      );
    });
  }, [endpoints, kind, runtime, search]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup<KindFilter>
          options={KIND_OPTIONS}
          value={kind}
          onChange={setKind}
        />
        <FilterChipGroup<RuntimeFilter>
          options={RUNTIME_OPTIONS}
          value={runtime}
          onChange={setRuntime}
          className="ml-1"
        />
        <SearchInput value={search} onChange={setSearch} placeholder="search…" />
        <button
          onClick={() => openOverlay('apiContracts')}
          className="ml-1 inline-flex h-5 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[10px] tracking-caps text-ink-2 hover:bg-bg-hover"
          title="Open API Contracts overlay"
        >
          <Icon.Layers className="h-3 w-3" />
          contracts
        </button>
        <span className="ml-1 text-[10px] text-ink-3">{filtered.length}</span>
      </TabHeader>

      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line/60">
        {filtered.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-ink-3">
            No endpoints match.
          </div>
        ) : (
          filtered.map((e) => (
            <EndpointContextMenu key={e.id} endpoint={e}>
              <button
                type="button"
                onClick={() => toast(`Open ${e.name}`, { description: `${e.file}:${e.line}` })}
                className="grid w-full grid-cols-[16px_1fr_88px_42px_22px_22px_42px] items-center gap-2 px-2 py-1 text-left text-xs hover:bg-bg-hover"
              >
                {kindIcon(e.kind)}
                <span className="min-w-0 truncate">
                  <span className="font-medium text-ink-1">{e.name}</span>
                  {e.path ? (
                    <span className="ml-1.5 font-mono text-[10px] text-ink-3">{e.path}</span>
                  ) : null}
                </span>
                <span>
                  {e.method ? (
                    <Chip tone={methodTone(e.method)} size="xs" className="font-mono font-semibold">
                      {e.method}
                    </Chip>
                  ) : (
                    <span className="text-[10px] text-ink-3">—</span>
                  )}
                </span>
                <Tooltip content={e.hasZodSchema ? 'has Zod schema' : 'no Zod schema'}>
                  <span
                    className={
                      e.hasZodSchema
                        ? 'inline-block h-2 w-2 rounded-full bg-sem-static'
                        : 'inline-block h-2 w-2 rounded-full bg-sev-warn'
                    }
                  />
                </Tooltip>
                <Tooltip content={e.authRequired ? 'auth required' : 'public'}>
                  {e.authRequired ? (
                    <Icon.Lock className="h-3 w-3 text-accent" />
                  ) : (
                    <Icon.Globe className="h-3 w-3 text-ink-3" />
                  )}
                </Tooltip>
                <span className="inline-flex items-center justify-end gap-0.5">
                  {e.driftedFromConsumer ? (
                    <Chip tone="err" size="xs" title="contract drift detected">
                      drift
                    </Chip>
                  ) : null}
                  {e.versionTag ? (
                    <Chip tone="muted" size="xs" className="font-mono">
                      {e.versionTag}
                    </Chip>
                  ) : null}
                </span>
                <span className="text-right text-[10px] text-ink-3" title="consumers">
                  {e.consumers.length}c
                </span>
              </button>
            </EndpointContextMenu>
          ))
        )}
      </div>
    </div>
  );
}
