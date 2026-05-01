import { match, P } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useRouteStore } from '@entities/route';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useActionStore } from '@entities/server-action';
import {
  Button,
  Chip,
  ConfidenceDot,
  Inspector,
  RenderingChip,
  Section,
  SeverityDot,
  SeverityLabel,
  Tooltip,
} from '@shared/ui';
import type {
  BoundaryState,
  Confidence,
  CostClass,
  DataSource,
  Diagnostic,
  RenderingClass,
  Route,
  RouteAuth,
  RouteMetadataCoverage,
} from '@shared/types';
import { cn } from '@shared/lib/cn';
import { EmptyState, KvRow, StateIcon } from '../parts';
import { RouteModeSection } from './route-mode-section';
import { FullstackTraceLauncher } from '@features/fullstack-trace';

interface Props {
  routeId: string;
}

const renderingLabel = (
  rendering: RenderingClass,
  revalidate: number | null | undefined,
): string =>
  match(rendering)
    .with('static', () => 'Static (SSG)')
    .with('isr', () =>
      revalidate ? `ISR (revalidate ${revalidate})` : 'ISR',
    )
    .with('dynamic', () => 'Dynamic (SSR)')
    .with('unknown', () => 'Unknown')
    .exhaustive();

const renderingCauseFallback = (rendering: RenderingClass): string =>
  match(rendering)
    .with('static', () => 'no dynamic markers detected')
    .with('isr', () => 'export const revalidate set on segment')
    .with('dynamic', () => 'cookies()/headers()/searchParams in tree')
    .with('unknown', () => 'no analysis evidence')
    .exhaustive();

const confidenceLabel = (c: Confidence): string =>
  match(c)
    .with('high', () => 'High')
    .with('medium', () => 'Medium')
    .with('low', () => 'Low')
    .exhaustive();

const whatIfTarget = (rendering: RenderingClass): { from: CostClass; to: CostClass } =>
  match(rendering)
    .with('static', () => ({ from: 'A' as const, to: 'D' as const }))
    .with('isr', () => ({ from: 'B' as const, to: 'D' as const }))
    .with('dynamic', () => ({ from: 'D' as const, to: 'E' as const }))
    .with('unknown', () => ({ from: 'B' as const, to: 'D' as const }))
    .exhaustive();

const staleRiskFor = (route: Route): { level: 'Low' | 'Medium' | 'High'; tone: string } => {
  const hasInvalidator = route.cacheTags.length > 0; // mock heuristic
  if (route.rendering === 'dynamic') return { level: 'Low', tone: 'text-sem-static' };
  if (!hasInvalidator) return { level: 'High', tone: 'text-sev-err' };
  if (route.rendering === 'isr') return { level: 'Low', tone: 'text-sem-static' };
  return { level: 'Medium', tone: 'text-sev-warn' };
};

const boundaryStateFor = (
  s: BoundaryState,
): { state: 'ok' | 'missing' | 'unknown'; label: string } =>
  match(s)
    .with('present', () => ({ state: 'ok' as const, label: 'present' }))
    .with('missing', () => ({ state: 'missing' as const, label: 'missing' }))
    .with('na', () => ({ state: 'unknown' as const, label: 'n/a' }))
    .exhaustive();

const BOUNDARY_FILES: Array<{
  key: keyof Route['boundaries'];
  file: string;
  scaffold: string;
}> = [
  { key: 'loading', file: 'loading.tsx', scaffold: 'loading.tsx' },
  { key: 'error', file: 'error.tsx', scaffold: 'error.tsx' },
  { key: 'notFound', file: 'not-found.tsx', scaffold: 'not-found.tsx' },
  { key: 'default', file: 'default.tsx', scaffold: 'default.tsx' },
  { key: 'template', file: 'template.tsx', scaffold: 'template.tsx' },
];

const META_FIELDS: Array<{
  key: keyof RouteMetadataCoverage;
  label: string;
  scaffold: string;
}> = [
  { key: 'title', label: 'title', scaffold: 'title' },
  { key: 'description', label: 'desc', scaffold: 'description' },
  { key: 'canonical', label: 'canonical', scaffold: 'alternates.canonical' },
  { key: 'openGraph', label: 'og.image', scaffold: 'openGraph.images' },
  { key: 'robots', label: 'robots', scaffold: 'robots' },
  { key: 'isGenerated', label: 'generated', scaffold: 'generateMetadata' },
];

const dataKindTone = (kind: DataSource['kind']) =>
  match(kind)
    .with('fetch', () => 'info' as const)
    .with('db', () => 'accent' as const)
    .with('helper', () => 'muted' as const)
    .with('cache', () => 'static' as const)
    .exhaustive();

const authGuardLabel = (auth: RouteAuth): string =>
  match(auth.guard)
    .with('none', () => 'none (public)')
    .with('requireUser', () => 'requireUser')
    .with('requireRole', () => 'requireRole')
    .with('middleware', () => 'middleware')
    .exhaustive();

const authMatches = (auth: RouteAuth): boolean =>
  match([auth.guard, auth.archetypeExpected] as const)
    .with(['none', 'public'], () => true)
    .with([P.union('requireUser', 'requireRole', 'middleware'), 'user'], () => true)
    .with(['requireRole', 'admin'], () => true)
    .with(['middleware', 'admin'], () => true)
    .otherwise(() => false);

export function RouteContractInspector({ routeId }: Props) {
  const route = useRouteStore((s) => s.byId(routeId));
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const openTab = useEditorStore((s) => s.openTab);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const actions = useActionStore((s) => s.actions);

  if (!route) {
    return (
      <Inspector
        title="ROUTE"
        meta={routeId}
        pinned={inspectorPinned}
        onTogglePin={togglePin}
      >
        <EmptyState>Route not found.</EmptyState>
      </Inspector>
    );
  }

  const firstDataSource = route.dataSources[0];
  const renderingDetail = renderingLabel(route.rendering, firstDataSource?.revalidate);
  const cause = route.renderingCause ?? renderingCauseFallback(route.rendering);
  const what = whatIfTarget(route.rendering);
  const stale = staleRiskFor(route);
  const routeRisks: Diagnostic[] = diagnostics.filter(
    (d) => d.routeId === route.id,
  );

  const pairAction = actions.find(
    (a) =>
      a.routeId === route.id &&
      a.checklist.some((c) => c.key === 'revalidate' && c.state === 'ok'),
  );
  const hasAnyTags = route.cacheTags.length > 0;

  const authMatch = authMatches(route.auth);

  const handleOpenLocation = (file: string, line: number): void => {
    const id = `tab-${file}`;
    openTab({ id, file, label: file.split('/').pop() ?? file });
    toast(`Open ${file}:${line}`);
  };

  const generate = (label: string): void => {
    toast(`Generate ${label} (preview)`);
  };

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <span className="text-caps text-[11px] uppercase text-ink-3">ROUTE</span>
          <span className="font-mono text-sm text-ink-1">{route.path}</span>
          <RenderingChip
            rendering={route.rendering}
            confidence={route.renderingConfidence}
            showQuestion
          />
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          archetype: <span className="text-ink-2">{route.archetype}</span>
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Resolved render mode (Phase 12) ------------------------------ */}
      <RouteModeSection routeId={route.id} />

      {/* One-click Fullstack Trace (Phase 6 — 36-2) -------------------- */}
      <div className="px-3 pt-2">
        <FullstackTraceLauncher routeId={route.id} variant="section" />
      </div>

      {/* Rendering ----------------------------------------------------- */}
      <Section title="Rendering" defaultOpen>
        <div className="space-y-0">
          <KvRow label="Mode">
            <span className="font-mono text-xs text-ink-2">{renderingDetail}</span>
          </KvRow>
          <KvRow label="Cause">
            <span className="font-mono text-xs text-ink-2">{cause}</span>
          </KvRow>
          <KvRow label="Confidence">
            <span className="inline-flex items-center gap-1.5">
              <ConfidenceDot confidence={route.renderingConfidence} />
              <span className="text-xs text-ink-2">
                {confidenceLabel(route.renderingConfidence)}
              </span>
            </span>
          </KvRow>
          <KvRow label="What if">
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span className="font-mono text-ink-2">force-dynamic?</span>
              <span className="text-ink-3">→</span>
              <span className="text-ink-2">cost</span>
              <Chip size="xs" tone="static">
                {what.from}
              </Chip>
              <span className="text-ink-3">→</span>
              <Chip size="xs" tone="warn">
                {what.to}
              </Chip>
            </span>
          </KvRow>
        </div>
      </Section>

      {/* Cache --------------------------------------------------------- */}
      <Section title="Cache" defaultOpen>
        <div className="space-y-1">
          <KvRow label="Tags">
            {hasAnyTags ? (
              <span className="flex flex-wrap gap-1">
                {route.cacheTags.map((tag) => (
                  <Chip key={tag} tone="info" size="xs">
                    <span className="font-mono">{tag}</span>
                  </Chip>
                ))}
              </span>
            ) : (
              <span className="text-xs text-ink-3">none</span>
            )}
          </KvRow>
          <KvRow label="Pair">
            {pairAction ? (
              <span className="inline-flex items-center gap-1.5 text-xs">
                <StateIcon state="ok" />
                <span className="text-sem-static">
                  revalidateTag in{' '}
                  <span className="font-mono">{pairAction.name}</span>
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs">
                <StateIcon state="warn" />
                <span className="text-sev-warn">no pair found</span>
              </span>
            )}
          </KvRow>
          <KvRow label="Stale risk">
            <span className={cn('text-xs font-medium', stale.tone)}>{stale.level}</span>
          </KvRow>
        </div>
      </Section>

      {/* Boundaries ---------------------------------------------------- */}
      <Section title="Boundaries" defaultOpen>
        <div className="space-y-0">
          {BOUNDARY_FILES.map(({ key, file, scaffold }) => {
            const status = boundaryStateFor(route.boundaries[key]);
            return (
              <div
                key={key}
                className="grid min-h-[28px] grid-cols-[120px_1fr_auto] items-center gap-2 py-0.5 text-sm"
              >
                <span className="font-mono text-xs text-ink-2">{file}</span>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <StateIcon state={status.state} />
                  <span
                    className={cn(
                      status.state === 'ok' && 'text-sem-static',
                      status.state === 'missing' && 'text-sev-err',
                      status.state === 'unknown' && 'text-ink-3',
                    )}
                  >
                    {status.label}
                  </span>
                </span>
                {status.state === 'missing' ? (
                  <Button size="xs" tone="soft" onClick={() => generate(scaffold)}>
                    Generate
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>

      {/* SEO / Metadata ------------------------------------------------ */}
      <Section title="SEO / Metadata" defaultOpen>
        <div className="space-y-0">
          {META_FIELDS.map(({ key, label, scaffold }) => {
            const ok = route.metadata[key];
            return (
              <div
                key={key}
                className="grid min-h-[28px] grid-cols-[120px_1fr_auto] items-center gap-2 py-0.5 text-sm"
              >
                <span className="font-mono text-xs text-ink-2">{label}</span>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <StateIcon state={ok ? 'ok' : 'missing'} />
                  <span className={ok ? 'text-sem-static' : 'text-sev-err'}>
                    {ok ? 'present' : 'missing'}
                  </span>
                </span>
                {ok ? null : (
                  <Button size="xs" tone="soft" onClick={() => generate(scaffold)}>
                    Generate
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Auth ---------------------------------------------------------- */}
      <Section title="Auth" defaultOpen={false}>
        <div className="space-y-0">
          <KvRow label="Guard">
            <span className="font-mono text-xs text-ink-2">
              {authGuardLabel(route.auth)}
            </span>
          </KvRow>
          <KvRow label="Expected">
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span className="font-mono text-ink-2">
                {route.auth.archetypeExpected}
              </span>
              {authMatch ? (
                <StateIcon state="ok" />
              ) : (
                <Tooltip content="Guard does not satisfy archetype expectation">
                  <span className="inline-flex items-center gap-1 text-sev-warn">
                    <StateIcon state="warn" />
                    <span>mismatch</span>
                  </span>
                </Tooltip>
              )}
            </span>
          </KvRow>
        </div>
      </Section>

      {/* Data ---------------------------------------------------------- */}
      <Section title={`Data (${route.dataSources.length})`} defaultOpen={false}>
        {route.dataSources.length === 0 ? (
          <EmptyState>No data sources detected.</EmptyState>
        ) : (
          <div className="space-y-1">
            {route.dataSources.map((ds) => (
              <div
                key={ds.id}
                className="flex flex-wrap items-center gap-1.5 py-0.5 text-xs"
              >
                <span className="font-mono text-ink-2">{ds.name}</span>
                <Chip tone={dataKindTone(ds.kind)} size="xs">
                  {ds.kind}
                </Chip>
                {ds.cacheTags.map((t) => (
                  <Chip key={t} tone="info" size="xs">
                    <span className="font-mono">tag:{t}</span>
                  </Chip>
                ))}
                {typeof ds.revalidate === 'number' ? (
                  <Chip tone="muted" size="xs">
                    <span className="font-mono">revalidate {ds.revalidate}</span>
                  </Chip>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Client Islands ------------------------------------------------ */}
      <Section
        title={`Client Islands (${route.islands.length})`}
        defaultOpen={false}
      >
        {route.islands.length === 0 ? (
          <EmptyState>No client islands attached.</EmptyState>
        ) : (
          <div className="space-y-0.5">
            {route.islands.map((island) => (
              <button
                key={island.id}
                type="button"
                onClick={() =>
                  setInspectorContext({ kind: 'boundary', islandId: island.id })
                }
                className="flex w-full items-center justify-between gap-2 rounded-sm px-1 py-1 text-left text-xs hover:bg-bg-hover"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Chip tone="client" size="xs">
                    client
                  </Chip>
                  <span className="font-mono text-ink-2">{island.name}</span>
                </span>
                <Chip tone="muted" size="xs">
                  <span className="font-mono">{island.estimatedKb}KB</span>
                </Chip>
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* Risks --------------------------------------------------------- */}
      <Section title={`Risks (${routeRisks.length})`} defaultOpen={false}>
        {routeRisks.length === 0 ? (
          <EmptyState>No diagnostics for this route.</EmptyState>
        ) : (
          <div className="space-y-0">
            {routeRisks.map((d) => (
              <div
                key={d.id}
                className="grid min-h-[28px] grid-cols-[16px_44px_1fr_auto] items-center gap-2 py-0.5 text-xs"
              >
                <ConfidenceDot confidence={d.confidence} />
                <SeverityLabel severity={d.severity} />
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <SeverityDot severity={d.severity} />
                  <span className="truncate text-ink-2">{d.title}</span>
                </span>
                <Button
                  size="icon"
                  tone="ghost"
                  onClick={() => handleOpenLocation(d.location.file, d.location.line)}
                  aria-label={`Jump to ${d.title}`}
                  title="Jump to location"
                >
                  →
                </Button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Inspector>
  );
}
