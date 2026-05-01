import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useDatabaseStore } from '@entities/database';
import type { ApiEndpoint, ApiEndpointKind, ApiHttpMethod } from '@shared/types';
import {
  Button,
  Chip,
  CodeBlock,
  Icon,
  OverlayPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';

const TABS: ReadonlyArray<{ value: ApiEndpointKind | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'handler', label: 'Handlers' },
  { value: 'action', label: 'Actions' },
  { value: 'trpc', label: 'tRPC' },
  { value: 'graphql', label: 'GraphQL' },
];

const methodTone = (m: ApiHttpMethod) =>
  match(m)
    .with('GET', () => 'static' as const)
    .with('POST', () => 'info' as const)
    .with('PUT', () => 'isr' as const)
    .with('PATCH', () => 'isr' as const)
    .with('DELETE', () => 'err' as const)
    .exhaustive();

const kindIcon = (kind: ApiEndpointKind) =>
  match(kind)
    .with('handler', () => <Icon.Globe className="h-3 w-3 text-sem-edge" />)
    .with('action', () => <Icon.Zap className="h-3 w-3 text-sem-server" />)
    .with('trpc', () => <Icon.Net className="h-3 w-3 text-accent" />)
    .with('graphql', () => <Icon.Hex className="h-3 w-3 text-sem-isr" />)
    .exhaustive();

function EndpointRow({ endpoint }: { endpoint: ApiEndpoint }) {
  const [expanded, setExpanded] = useState(false);
  const openOverlay = useUiStore((s) => s.openOverlay);
  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          'grid w-full grid-cols-[16px_minmax(160px,1.4fr)_minmax(140px,1fr)_minmax(180px,1.4fr)_minmax(120px,1fr)_minmax(120px,1fr)_64px_64px] items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-bg-hover',
          expanded && 'bg-bg-subtle/60',
        )}
      >
        {kindIcon(endpoint.kind)}
        <span className="min-w-0 truncate">
          <span className="font-medium text-ink-1">{endpoint.name}</span>
          {endpoint.versionTag ? (
            <Chip tone="muted" size="xs" className="ml-1.5 font-mono">
              {endpoint.versionTag}
            </Chip>
          ) : null}
        </span>
        <span className="inline-flex items-center gap-1 truncate font-mono text-[11px] text-ink-3">
          {endpoint.method ? (
            <Chip tone={methodTone(endpoint.method)} size="xs" className="font-mono font-semibold">
              {endpoint.method}
            </Chip>
          ) : null}
          {endpoint.path ?? '—'}
        </span>
        <span className="truncate font-mono text-[11px] text-ink-3">
          {endpoint.file}:{endpoint.line}
        </span>
        <span className="truncate font-mono text-[11px] text-ink-2">
          {endpoint.inputType ?? '—'}
        </span>
        <span className="truncate font-mono text-[11px] text-ink-2">
          {endpoint.outputType ?? '—'}
        </span>
        <span className="inline-flex items-center justify-center gap-1">
          <Tooltip content={endpoint.hasZodSchema ? 'has Zod' : 'no Zod'}>
            <span
              className={
                endpoint.hasZodSchema
                  ? 'inline-block h-2 w-2 rounded-full bg-sem-static'
                  : 'inline-block h-2 w-2 rounded-full bg-sev-warn'
              }
            />
          </Tooltip>
          <Tooltip content={endpoint.authRequired ? 'auth' : 'public'}>
            {endpoint.authRequired ? (
              <Icon.Lock className="h-3 w-3 text-accent" />
            ) : (
              <Icon.Globe className="h-3 w-3 text-ink-3" />
            )}
          </Tooltip>
        </span>
        <span className="inline-flex items-center justify-end gap-0.5">
          {endpoint.driftedFromConsumer ? (
            <Chip tone="err" size="xs">
              drift
            </Chip>
          ) : (
            <span className="text-[10px] text-ink-3">{endpoint.consumers.length}c</span>
          )}
        </span>
      </button>
      {expanded ? (
        <div className="hairline-b bg-bg-subtle/30 px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-caps text-[10px] uppercase text-ink-3">
                Input shape
              </div>
              <CodeBlock
                code={endpoint.inputShape ?? endpoint.inputType ?? 'void'}
                language="ts"
                showLineNumbers={false}
                maxHeight={120}
              />
            </div>
            <div>
              <div className="mb-1 text-caps text-[10px] uppercase text-ink-3">
                Output shape
              </div>
              <CodeBlock
                code={endpoint.outputShape ?? endpoint.outputType ?? 'void'}
                language="ts"
                showLineNumbers={false}
                maxHeight={120}
              />
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 text-caps text-[10px] uppercase text-ink-3">
              Consumers ({endpoint.consumers.length})
            </div>
            {endpoint.consumers.length === 0 ? (
              <div className="text-xs text-ink-3">No consumers detected.</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {endpoint.consumers.map((c) => (
                  <Chip key={c} tone="muted" size="xs" className="font-mono">
                    {c}
                  </Chip>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="xs"
              tone="soft"
              onClick={() => toast(`Open ${endpoint.file}:${endpoint.line}`)}
            >
              Open
            </Button>
            <Button
              size="xs"
              tone="soft"
              onClick={() =>
                toast(`Generate openapi.json fragment for ${endpoint.name}`, {
                  description: 'copied to clipboard (mock)',
                })
              }
            >
              Generate openapi.json
            </Button>
            <Button
              size="xs"
              tone="soft"
              onClick={() =>
                openOverlay('findReferences', {
                  kind: 'symbol',
                  symbol: endpoint.name,
                })
              }
            >
              Find references
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ApiContractsOverlay() {
  const open = useUiStore((s) => s.overlays.apiContracts.open);
  const close = useUiStore((s) => s.closeOverlay);
  const endpoints = useDatabaseStore((s) => s.endpoints);
  const [tab, setTab] = useState<ApiEndpointKind | 'all'>('all');

  const counts = useMemo(() => {
    const c: Record<ApiEndpointKind | 'all', number> = {
      all: endpoints.length,
      handler: 0,
      action: 0,
      trpc: 0,
      graphql: 0,
    };
    for (const e of endpoints) c[e.kind]++;
    return c;
  }, [endpoints]);

  const visible = useMemo(
    () => (tab === 'all' ? endpoints : endpoints.filter((e) => e.kind === tab)),
    [endpoints, tab],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('apiContracts'))}
      title="API Contracts"
      subtitle="route handlers · server actions · tRPC · GraphQL"
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {visible.length} of {endpoints.length} endpoints
          </span>
          <Button
            size="sm"
            tone="soft"
            onClick={() =>
              toast('Export OpenAPI 3.1', {
                description: 'mock JSON copied to clipboard',
              })
            }
          >
            Export OpenAPI 3.1
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast('Generate tRPC client types', {
                description: 'wrote .trpc/types.ts (mock)',
              })
            }
          >
            Generate tRPC client types
          </Button>
        </>
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as ApiEndpointKind | 'all')}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              <Chip tone="muted" size="xs" className="ml-1 font-mono">
                {counts[t.value]}
              </Chip>
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="m-0">
            <div className="grid grid-cols-[16px_minmax(160px,1.4fr)_minmax(140px,1fr)_minmax(180px,1.4fr)_minmax(120px,1fr)_minmax(120px,1fr)_64px_64px] items-center gap-2 px-3 py-1 hairline-b bg-bg-subtle text-caps text-[10px] uppercase text-ink-3">
              <span />
              <span>name</span>
              <span>path / method</span>
              <span>file:line</span>
              <span>input</span>
              <span>output</span>
              <span className="text-center">flags</span>
              <span className="text-right">consumers</span>
            </div>
            <div className="divide-y divide-line/60">
              {visible.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-xs text-ink-3">
                  No endpoints in this surface.
                </div>
              ) : (
                visible.map((e) => <EndpointRow key={e.id} endpoint={e} />)
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </OverlayPanel>
  );
}
