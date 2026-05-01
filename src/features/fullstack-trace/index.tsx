/**
 * Phase 6 — Fullstack Trace overlay.
 *
 * Public:
 *   - <FullstackTraceOverlay open routePath onOpenChange />
 *   - <FullstackTraceLauncher routeId /> — small button suitable for
 *     embedding inside the Route Inspector.
 *   - buildTrace, traceToMarkdown — re-exported.
 */

import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { useEditorStore } from '@entities/editor';
import { useRouteStore } from '@entities/route';
import { Button, Chip, Icon, ScrollArea, SearchInput } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { buildTrace, traceToMarkdown } from './builder';
import type { TraceNode, TraceNodeKind, TraceRiskLevel } from './types';

export type { TraceNode, TraceNodeKind, TraceRiskLevel } from './types';
export { buildTrace, traceToMarkdown, filterTrace } from './builder';

interface OverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routePath: string;
}

export function FullstackTraceOverlay({ open, onOpenChange, routePath }: OverlayProps) {
  const [search, setSearch] = useState('');
  const [compact, setCompact] = useState(false);
  const openTab = useEditorStore((s) => s.openTab);

  const route = useRouteStore((s) => s.routes.find((r) => r.path === routePath));
  const trace = useMemo(() => (open ? buildTrace(routePath) : []), [open, routePath]);

  const filtered = useMemo(() => {
    if (!search) return trace;
    const q = search.toLowerCase();
    return trace.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        (n.file ?? '').toLowerCase().includes(q) ||
        (n.detail ?? '').toLowerCase().includes(q) ||
        n.kind.includes(q),
    );
  }, [trace, search]);

  const onJump = (file?: string, line?: number) => {
    if (!file) return;
    openTab({
      id: `tab-${file.replace(/[^a-zA-Z0-9]/g, '-')}`,
      file,
      label: file.split('/').pop() ?? file,
    });
    void line;
  };

  const onCopyMarkdown = async () => {
    const md = traceToMarkdown(routePath, filtered.length > 0 ? filtered : trace);
    try {
      await navigator.clipboard.writeText(md);
      toast.success('Trace copied as Markdown');
    } catch {
      toast.error('Clipboard unavailable');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'duration-200',
          )}
        />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-stretch justify-center p-4 sm:p-8">
          <Dialog.Content
            aria-describedby={undefined}
            className={cn(
              'pointer-events-auto flex w-full max-w-[1100px] flex-col overflow-hidden rounded-md',
              'border border-line/80 bg-bg/90 shadow-pop backdrop-blur-md',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.99]',
              'duration-220 ease-out',
            )}
          >
            {/* Sticky header */}
            <header className="sticky top-0 z-10 flex items-start gap-3 px-4 py-3 hairline-b bg-bg/80 backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <Dialog.Title asChild>
                  <h2 className="flex items-center gap-2 text-md font-semibold text-ink-1">
                    <Icon.Net className="h-4 w-4 text-accent" />
                    Fullstack Trace
                    <span className="font-mono text-sm font-normal text-ink-3">{routePath}</span>
                  </h2>
                </Dialog.Title>
                <div className="mt-0.5 text-xs text-ink-3">
                  {route ? (
                    <>
                      <Chip tone={route.rendering === 'static' ? 'static' : route.rendering === 'dynamic' ? 'dynamic' : 'isr'} size="xs">
                        {route.rendering}
                      </Chip>{' '}
                      <span className="font-mono">{trace.length} nodes</span> · click any node to jump.
                    </>
                  ) : (
                    'Route not found.'
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-44">
                  <SearchInput value={search} onChange={setSearch} placeholder="Filter trace" />
                </div>
                <Button tone="ghost" size="sm" onClick={() => setCompact((v) => !v)}>
                  {compact ? 'Detailed' : 'Compact'}
                </Button>
                <Button tone="soft" size="sm" onClick={onCopyMarkdown}>
                  <Icon.Doc className="h-3.5 w-3.5" />
                  Copy MD
                </Button>
                <Dialog.Close asChild>
                  <Button tone="ghost" size="icon" aria-label="Close">
                    <Icon.X className="h-4 w-4" />
                  </Button>
                </Dialog.Close>
              </div>
            </header>

            <ScrollArea className="flex-1 max-h-[78vh]">
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-ink-3">
                  {trace.length === 0 ? 'No trace data — open a route first.' : 'No nodes match the filter.'}
                </div>
              ) : (
                <ol className="relative px-6 py-4">
                  {filtered.map((n, i) => (
                    <TraceRow
                      key={n.id}
                      node={n}
                      isLast={i === filtered.length - 1}
                      compact={compact}
                      onJump={() => onJump(n.file, n.line)}
                    />
                  ))}
                </ol>
              )}
            </ScrollArea>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Inline launcher — drop into the Route Inspector
// ─────────────────────────────────────────────────────────────────────────

interface LauncherProps {
  routeId?: string;
  routePath?: string;
  size?: 'xs' | 'sm';
  variant?: 'button' | 'section';
}

export function FullstackTraceLauncher({ routeId, routePath, size = 'sm', variant = 'button' }: LauncherProps) {
  const [open, setOpen] = useState(false);
  const route = useRouteStore((s) =>
    routeId ? s.routes.find((r) => r.id === routeId) : routePath ? s.routes.find((r) => r.path === routePath) : undefined,
  );
  const path = route?.path ?? routePath ?? '';

  if (variant === 'section') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'group flex w-full items-center gap-2 rounded-sm px-2 py-1.5',
            'border border-line/60 bg-gradient-to-r from-accent-soft/30 to-transparent',
            'hover:from-accent-soft/50 transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40',
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Icon.Net className="h-3.5 w-3.5" />
          </span>
          <span className="flex flex-col items-start">
            <span className="text-[11px] font-medium text-ink-1">Trace Everything</span>
            <span className="text-[10px] text-ink-3">layout → page → actions → cache</span>
          </span>
          <Icon.UpRight className="ml-auto h-3 w-3 text-ink-3 group-hover:text-accent" />
        </button>
        <FullstackTraceOverlay open={open} onOpenChange={setOpen} routePath={path} />
      </>
    );
  }

  return (
    <>
      <Button size={size} tone="default" onClick={() => setOpen(true)} disabled={!path}>
        <Icon.Net className="h-3 w-3" />
        Trace Everything
      </Button>
      <FullstackTraceOverlay open={open} onOpenChange={setOpen} routePath={path} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// One node in the trace timeline
// ─────────────────────────────────────────────────────────────────────────

interface RowProps {
  node: TraceNode;
  isLast: boolean;
  compact: boolean;
  onJump?: () => void;
}

function TraceRow({ node, isLast, compact, onJump }: RowProps) {
  return (
    <li className="relative pl-8">
      {/* Vertical connector */}
      {!isLast ? (
        <span
          aria-hidden
          className={cn(
            'absolute left-[14px] top-6 h-[calc(100%-8px)] w-px',
            riskGradientFor(node.risk),
          )}
        />
      ) : null}

      {/* Node dot */}
      <span
        aria-hidden
        className={cn(
          'absolute left-[8px] top-2.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-bg',
          riskBgFor(node.risk),
          'transition-transform duration-200 ease-out',
        )}
      />

      <button
        type="button"
        onClick={onJump}
        disabled={!node.file}
        className={cn(
          'block w-full rounded-sm px-2 py-1.5 text-left',
          'transition-colors duration-150 hover:bg-bg-hover focus-visible:bg-bg-hover focus-visible:outline-none',
          'animate-in fade-in slide-in-from-left-1 duration-200',
          !node.file && 'cursor-default',
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="rounded-sm border border-line bg-bg-subtle px-1 py-0 text-[10px] uppercase tracking-caps text-ink-3">
            {labelForKind(node.kind)}
          </span>
          <span className="truncate text-sm text-ink-1">{node.label}</span>
          {node.badges?.map((b) => (
            <Chip key={b} tone="muted" size="xs">
              {b}
            </Chip>
          ))}
          {node.severity ? (
            <Chip tone={node.severity === 'err' ? 'err' : node.severity === 'warn' ? 'warn' : 'info'} size="xs">
              {node.severity}
            </Chip>
          ) : null}
          {node.file ? (
            <span className="ml-auto truncate font-mono text-[10px] text-ink-3">
              {node.file.split('/').pop()}:{node.line ?? 1}
            </span>
          ) : null}
        </div>
        {!compact && node.detail ? (
          <div className="mt-0.5 truncate text-[11px] text-ink-3">{node.detail}</div>
        ) : null}
        {!compact && node.tests && node.tests.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {node.tests.map((t, i) => (
              <Chip key={i} tone={t.status === 'pass' ? 'static' : t.status === 'fail' ? 'err' : 'muted'} size="xs">
                {t.file.split('/').pop()}:{t.line}
              </Chip>
            ))}
          </div>
        ) : null}
      </button>
    </li>
  );
}

function labelForKind(kind: TraceNodeKind): string {
  switch (kind) {
    case 'cache-read':
      return 'cache·r';
    case 'cache-write':
      return 'cache·w';
    case 'server-action':
      return 'action';
    case 'route-handler':
      return 'handler';
    default:
      return kind;
  }
}

function riskBgFor(level: TraceRiskLevel): string {
  switch (level) {
    case 'high':
      return 'bg-sev-err';
    case 'medium':
      return 'bg-sev-warn';
    case 'low':
    default:
      return 'bg-sem-static';
  }
}

function riskGradientFor(level: TraceRiskLevel): string {
  switch (level) {
    case 'high':
      return 'bg-gradient-to-b from-sev-err/60 to-line';
    case 'medium':
      return 'bg-gradient-to-b from-sev-warn/60 to-line';
    case 'low':
    default:
      return 'bg-gradient-to-b from-sem-static/60 to-line';
  }
}
