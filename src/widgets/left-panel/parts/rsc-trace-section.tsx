import { useMemo } from 'react';
import {
  analyzeBoundaryChain,
  analyzeClientModules,
  analyzeServerActions,
  type BoundaryChainItem,
  useLastTraceStore,
} from '@entities/rsc-payload';
import { Chip } from '@shared/ui';

type Mode = 'boundary' | 'layouts' | 'metadata' | 'actions' | 'leak' | 'mid';

interface Props {
  /** Which slice of the trace to surface. */
  mode: Mode;
}

/**
 * Reusable section that surfaces a slice of the last RSC trace into a
 * left-panel tab. Each `mode` filters analyzers down to what the host tab
 * cares about, while sharing the same banner shell + selectors.
 */
export function RscTraceSection({ mode }: Props) {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);

  const boundary = useMemo(() => analyzeBoundaryChain(chunks), [chunks]);
  const modules = useMemo(() => analyzeClientModules(chunks), [chunks]);
  const actions = useMemo(() => analyzeServerActions(chunks), [chunks]);

  if (!url) return null;

  const layouts = boundary.filter(
    (b) => b.kind === 'layout-router' || b.kind === 'render-from-template',
  );
  const metadata = boundary.filter((b) => b.kind === 'metadata-boundary');
  const userLeaks = modules.filter(
    (m) => !m.isNextInternal && !m.isThirdParty,
  );

  return (
    <div className="border-t-2 border-line bg-bg-subtle">
      <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-ink-3">
        <span className="font-mono uppercase tracking-wide">probe</span>
        <span className="font-mono">{url}</span>
        <span className="ml-auto">{summaryCount(mode, { boundary, layouts, metadata, actions, userLeaks, totalChunks: chunks.length })}</span>
      </div>

      {mode === 'boundary' ? <BoundaryRows items={boundary} /> : null}
      {mode === 'layouts' ? <BoundaryRows items={layouts} /> : null}
      {mode === 'metadata' ? <BoundaryRows items={metadata} /> : null}
      {mode === 'actions' ? (
        actions.length === 0 ? (
          <Empty>No server-action descriptors detected — try the /action route.</Empty>
        ) : (
          <div className="divide-y divide-line/70">
            {actions.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 px-2 py-1 text-xs"
                title={a.actionId}
              >
                <span className="w-7 font-mono text-[10px] text-ink-3">{a.id}</span>
                <span className="font-mono text-ink-1">{a.name}()</span>
                <span className="ml-auto font-mono text-[10px] text-ink-3">
                  {a.sizeBytes}B
                </span>
                <Chip tone="info" size="xs">action</Chip>
              </div>
            ))}
          </div>
        )
      ) : null}
      {mode === 'leak' ? (
        userLeaks.length === 0 ? (
          <Empty>No user client modules ship — clean.</Empty>
        ) : (
          <div className="divide-y divide-line/70">
            {userLeaks.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-2 py-1 text-xs"
                title={m.modulePath}
              >
                <span className="w-7 font-mono text-[10px] text-ink-3">{m.id}</span>
                <span className="font-mono text-ink-1">{m.label}</span>
                <span className="ml-auto font-mono text-[10px] text-ink-3">
                  {m.sizeBytes}B
                </span>
                <Chip tone="edge" size="xs">leak</Chip>
              </div>
            ))}
          </div>
        )
      ) : null}
      {mode === 'mid' ? (
        <Empty>
          Middleware inspection requires the loader plugin. RSC stream alone
          doesn't expose request headers.
        </Empty>
      ) : null}
    </div>
  );
}

function BoundaryRows({ items }: { items: ReadonlyArray<BoundaryChainItem> }) {
  if (items.length === 0) return <Empty>No matching boundary chunks.</Empty>;
  return (
    <div className="divide-y divide-line/70">
      {items.map((b) => (
        <div
          key={b.id + b.kind}
          className="flex items-center gap-2 px-2 py-1 text-xs"
          title={`@${Math.round(b.arrivedAtMs)}ms`}
        >
          <span className="w-7 font-mono text-[10px] text-ink-3">{b.id}</span>
          <span className="font-mono text-ink-1">{b.kind}</span>
          <span className="ml-auto font-mono text-[10px] text-ink-3">
            @{Math.round(b.arrivedAtMs)}ms
          </span>
        </div>
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-2 text-[11px] text-ink-3">{children}</div>;
}

function summaryCount(
  mode: Mode,
  data: {
    boundary: ReadonlyArray<unknown>;
    layouts: ReadonlyArray<unknown>;
    metadata: ReadonlyArray<unknown>;
    actions: ReadonlyArray<unknown>;
    userLeaks: ReadonlyArray<unknown>;
    totalChunks: number;
  },
): string {
  switch (mode) {
    case 'boundary':
      return `${data.boundary.length} boundary chunks`;
    case 'layouts':
      return `${data.layouts.length} layout chunks`;
    case 'metadata':
      return `${data.metadata.length} metadata boundaries`;
    case 'actions':
      return `${data.actions.length} actions`;
    case 'leak':
      return `${data.userLeaks.length} user leaks`;
    case 'mid':
      return `${data.totalChunks} chunks`;
  }
}
