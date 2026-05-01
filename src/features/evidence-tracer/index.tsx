import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { selectDiagnosticById, useDiagnosticStore } from '@entities/diagnostic';
import { useRouteStore } from '@entities/route';
import {
  Button,
  Chip,
  Icon,
  OverlayPanel,
  RenderingChip,
  Tooltip,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { Diagnostic, EvidenceItem, Route } from '@shared/types';
import {
  evidenceKindHint,
  evidenceKindLabel,
  groupEvidence,
  jumpTabId,
  peekFile,
  shortFile,
  type EvidenceKind,
} from './helpers';

const VISIBLE_ROUTES = 5;

export function EvidenceTracerOverlay() {
  const open = useUiStore((s) => s.overlays.evidenceTracer.open);
  const diagnosticId = useUiStore((s) => s.overlays.evidenceTracer.diagnosticId);
  const close = useUiStore((s) => s.closeOverlay);
  const pin = useUiStore((s) => s.pin);

  const routes = useRouteStore((s) => s.routes);
  const openTab = useEditorStore((s) => s.openTab);

  const diagnostic: Diagnostic | undefined = useDiagnosticStore(
    selectDiagnosticById(diagnosticId ?? ''),
  );

  const groups = useMemo(
    () => (diagnostic ? groupEvidence(diagnostic) : []),
    [diagnostic],
  );

  const affectedRoutes = useMemo(() => {
    if (!diagnostic) return [];
    const byId = new Map(routes.map((r) => [r.id, r]));
    return diagnostic.affectedRouteIds
      .map((id) => byId.get(id))
      .filter((r): r is Route => Boolean(r));
  }, [diagnostic, routes]);

  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const visibleRoutes = showAllRoutes
    ? affectedRoutes
    : affectedRoutes.slice(0, VISIBLE_ROUTES);
  const hiddenCount = Math.max(0, affectedRoutes.length - VISIBLE_ROUTES);

  const handleJump = (file: string, line: number) => {
    openTab({ id: jumpTabId(file), file, label: shortFile(file) });
    toast('Jumped to source', {
      description: `${file}:${line}`,
    });
  };

  const title = diagnostic?.title ?? 'Why dynamic?';
  const subtitle = diagnostic
    ? `${diagnostic.scope} · ${diagnostic.ruleId}`
    : 'Select a diagnostic from Problems or hover the gutter to inspect.';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('evidenceTracer'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Net className="h-4 w-4 text-ink-3" />
          <span>{title}</span>
        </span>
      }
      subtitle={subtitle}
      size="md"
      footer={
        diagnostic ? (
          <>
            <Button
              size="sm"
              tone="ghost"
              onClick={() => {
                pin({
                  id: `evt-${diagnostic.id}`,
                  title: `Why dynamic ${diagnostic.scope}`,
                  meta: 'cookies()@layout.tsx',
                });
                toast('Pinned to Why panel', {
                  description: diagnostic.scope,
                });
              }}
            >
              <Icon.Pin className="h-3 w-3" /> Pin
            </Button>
            <Button
              size="sm"
              tone="default"
              onClick={() =>
                toast('Suggestion queued', {
                  description: 'Move auth-dependent UI into a client island',
                })
              }
            >
              <Icon.Bulb className="h-3 w-3" /> Suggest move into client island
            </Button>
            <Button size="sm" tone="ghost" onClick={() => close('evidenceTracer')}>
              Close
            </Button>
          </>
        ) : (
          <Button size="sm" tone="ghost" onClick={() => close('evidenceTracer')}>
            Close
          </Button>
        )
      }
    >
      {diagnostic ? (
        <div className="grid grid-cols-[1.2fr_1fr] divide-x divide-line">
          <CallTracePane
            diagnostic={diagnostic}
            onJump={handleJump}
            groups={groups}
          />
          <AffectedRoutesPane
            total={affectedRoutes.length}
            routes={visibleRoutes}
            hiddenCount={hiddenCount}
            showAll={showAllRoutes}
            onToggle={() => setShowAllRoutes((v) => !v)}
            diagnostic={diagnostic}
          />
        </div>
      ) : (
        <EmptyState />
      )}
    </OverlayPanel>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-ink-3">
      <Icon.Net className="h-6 w-6" />
      <p className="font-medium text-ink-2">No diagnostic selected</p>
      <p className="max-w-[480px] text-xs">
        Open this panel from a Problem row, gutter marker, or `Show trace` on the
        Evidence card.
      </p>
    </div>
  );
}

function CallTracePane({
  diagnostic,
  groups,
  onJump,
}: {
  diagnostic: Diagnostic;
  groups: ReturnType<typeof groupEvidence>;
  onJump(file: string, line: number): void;
}) {
  return (
    <section className="min-w-0 px-4 py-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-caps text-ink-3">Call trace</h3>
        <span className="font-mono text-[11px] text-ink-3">
          {diagnostic.location.file}:{diagnostic.location.line}
        </span>
      </header>
      <div className="font-mono text-[12px] text-ink-2">
        <RootRow file={diagnostic.location.file} />
        <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-line pl-3">
          {groups.flatMap((g) =>
            g.items.map((item, idx) => (
              <EvidenceRow
                key={item.id}
                item={item}
                kind={g.kind}
                isRootCause={
                  g.kind === 'indirect' &&
                  idx === g.items.length - 1 &&
                  diagnostic.ruleId === 'why-dynamic'
                }
                onJump={onJump}
              />
            )),
          )}
        </ul>
      </div>
      {groups.length === 0 && (
        <p className="mt-2 text-xs text-ink-3">
          No structured evidence available — see message:
          <span className="ml-1 italic text-ink-2">{diagnostic.message}</span>
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {match(diagnostic.category)
          .with('rendering', () => <Chip tone="dynamic">RENDERING</Chip>)
          .with('boundary', () => <Chip tone="client">BOUNDARY</Chip>)
          .with('cache', () => <Chip tone="isr">CACHE</Chip>)
          .with('security', () => <Chip tone="err">SECURITY</Chip>)
          .with('action', () => <Chip tone="server">ACTION</Chip>)
          .otherwise((c) => (
            <Chip tone="muted">{String(c).toUpperCase()}</Chip>
          ))}
        <Chip tone="muted">{diagnostic.ruleId}</Chip>
        <Chip tone="muted">{diagnostic.confidence} confidence</Chip>
      </div>
    </section>
  );
}

function RootRow({ file }: { file: string }) {
  return (
    <div className="flex items-center gap-1.5 text-ink-1">
      <Icon.File className="h-3 w-3 text-ink-3" />
      <span>{file}</span>
    </div>
  );
}

function EvidenceRow({
  item,
  kind,
  isRootCause,
  onJump,
}: {
  item: EvidenceItem;
  kind: EvidenceKind;
  isRootCause: boolean;
  onJump(file: string, line: number): void;
}) {
  const peek = item.location
    ? peekFile(item.location.file, item.location.line)
    : null;
  const content = (
    <li
      className={cn(
        'group flex items-center gap-1.5 rounded-sm px-1 py-0.5 hover:bg-bg-hover',
        isRootCause && 'bg-sev-warn-soft/40',
      )}
    >
      <span className="text-[10px] text-ink-3">└─</span>
      <span className="min-w-0 flex-1 truncate text-ink-1">{item.label}</span>
      <Chip
        tone={match(kind)
          .with('direct', () => 'neutral' as const)
          .with('indirect', () => 'warn' as const)
          .with('heuristic', () => 'muted' as const)
          .exhaustive()}
        size="xs"
        className="font-normal normal-case tracking-normal"
      >
        {evidenceKindLabel[kind]}
      </Chip>
      {item.location && (
        <>
          <span className="font-mono text-[10px] text-ink-3">
            {shortFile(item.location.file)}:{item.location.line}
          </span>
          <button
            onClick={() =>
              onJump(item.location!.file, item.location!.line)
            }
            className="text-ink-3 transition-colors hover:text-accent"
            aria-label="Jump to location"
          >
            <Icon.UpRight className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      {isRootCause && (
        <Chip tone="warn" size="xs" className="font-normal normal-case">
          root cause
        </Chip>
      )}
    </li>
  );

  if (!peek) return content;

  return (
    <Tooltip
      side="right"
      align="start"
      delay={120}
      content={
        <div className="w-[320px]">
          <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-ink-3">
            <span className="font-mono">{peek.file}</span>
            <span className="font-mono">
              L{peek.startLine}-{peek.startLine + peek.lines.length - 1}
            </span>
          </div>
          <pre className="overflow-hidden rounded-sm border border-line bg-bg-subtle px-2 py-1.5 font-mono text-[11px] leading-snug text-ink-1">
            {peek.lines.map((l) => (
              <div
                key={l.line}
                className={cn(
                  'flex gap-2',
                  item.location && l.line === item.location.line && 'bg-sev-warn-soft',
                )}
              >
                <span className="w-6 shrink-0 text-right text-ink-3">{l.line}</span>
                <span className="truncate">{l.text || ' '}</span>
              </div>
            ))}
          </pre>
          <div className="mt-1 text-[10px] text-ink-3">{evidenceKindHint[kind]}</div>
        </div>
      }
    >
      {content}
    </Tooltip>
  );
}

function AffectedRoutesPane({
  total,
  routes,
  hiddenCount,
  showAll,
  onToggle,
  diagnostic,
}: {
  total: number;
  routes: Route[];
  hiddenCount: number;
  showAll: boolean;
  onToggle(): void;
  diagnostic: Diagnostic;
}) {
  return (
    <section className="min-w-0 px-4 py-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-caps text-ink-3">Affected routes ({total})</h3>
        {hiddenCount > 0 && (
          <button
            onClick={onToggle}
            className="text-[11px] text-accent hover:underline"
          >
            {showAll ? 'show fewer' : `show all (${hiddenCount} more)`}
          </button>
        )}
      </header>
      {routes.length > 0 ? (
        <ul className="space-y-0.5">
          {routes.map((route) => (
            <li
              key={route.id}
              className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-bg-hover"
            >
              <Icon.Globe className="h-3.5 w-3.5 text-ink-3" />
              <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-1">
                {route.path}
              </span>
              <RenderingChip
                rendering={route.rendering}
                confidence={route.renderingConfidence}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ink-3">
          No routes recorded as affected for this diagnostic.
        </p>
      )}

      {diagnostic.impact.length > 0 && (
        <div className="mt-3 hairline-t pt-3">
          <h3 className="mb-1 text-caps text-ink-3">Impact</h3>
          <ul className="space-y-0.5 text-xs text-ink-2">
            {diagnostic.impact.map((entry) => (
              <li key={entry} className="before:mr-1.5 before:content-['•']">
                {entry}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
