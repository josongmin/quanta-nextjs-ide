/**
 * "Why this mode" card.  Spec: numbered chain
 *   1. cookies() called in page.tsx:12
 *   2. → forces dynamic
 *   3. → final mode: dynamic
 */

import type { MouseEvent } from 'react';
import { Button, Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { modeLabel } from './resolver';
import type { ModeSignal, ResolvedMode } from './types';

interface Props {
  readonly resolved: ResolvedMode;
  readonly onClose?: (e?: MouseEvent) => void;
  readonly className?: string;
}

export function WhyCard({ resolved, onClose, className }: Props) {
  const steps = buildChain(resolved);
  return (
    <div
      className={cn(
        'rounded-sm border border-line bg-bg p-3 text-[11px] shadow-pop',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Render mode explanation"
    >
      <div className="flex items-center gap-2">
        <span className="text-caps text-[10px] uppercase tracking-wide text-ink-3">
          Resolved mode
        </span>
        <Chip size="xs" tone="accent">
          {modeLabel(resolved.mode)}
        </Chip>
        {resolved.confidence !== 'high' ? (
          <Chip size="xs" tone="muted">
            {resolved.confidence} confidence
          </Chip>
        ) : null}
        {onClose ? (
          <Button
            size="xs"
            tone="ghost"
            className="ml-auto"
            onClick={(e) => onClose(e)}
            aria-label="Close why card"
          >
            ✕
          </Button>
        ) : null}
      </div>

      <ol className="mt-2 space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              className={cn(
                'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-medium',
                s.terminal
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-line bg-bg-subtle text-ink-2',
              )}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className={s.terminal ? 'text-ink-1' : 'text-ink-2'}>
                {s.label}
              </div>
              {s.location ? (
                <div className="font-mono text-[10px] text-ink-3">
                  {s.location}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {resolved.overrides.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">
            overrides
          </span>
          {resolved.overrides.map((o) => (
            <Chip key={o} size="xs" tone="warn">
              {o}
            </Chip>
          ))}
        </div>
      ) : null}

      <div className="mt-2 rounded-sm border border-line bg-bg-subtle/40 p-2 text-ink-2">
        <span className="text-[10px] uppercase tracking-wide text-ink-3">
          final behavior
        </span>
        <div className="mt-0.5">{resolved.behavior}</div>
      </div>
    </div>
  );
}

interface ChainStep {
  label: string;
  location?: string;
  terminal?: boolean;
}

function buildChain(resolved: ResolvedMode): ChainStep[] {
  const steps: ChainStep[] = [];
  for (const sig of resolved.signals) {
    steps.push({
      label: `${labelFor(sig)} — ${sig.effect}`,
      location: `${sig.file}:${sig.line}`,
    });
  }
  if (steps.length === 0) {
    steps.push({
      label: 'No dynamic markers found in segment chain.',
    });
  }
  steps.push({
    label: `Final mode: ${modeLabel(resolved.mode)}`,
    terminal: true,
  });
  return steps;
}

function labelFor(sig: ModeSignal): string {
  switch (sig.kind) {
    case 'cookies':
      return 'cookies() called';
    case 'headers':
      return 'headers() called';
    case 'searchParams':
      return 'searchParams accessed';
    case 'noStore':
      return 'noStore() called';
    case 'fetch-no-store':
      return "fetch with cache: 'no-store'";
    case 'fetch-cache':
      return 'fetch with cache option';
    case 'revalidate':
      return 'revalidate exported';
    case 'force-dynamic':
      return "dynamic = 'force-dynamic'";
    case 'force-static':
      return "dynamic = 'force-static'";
    case 'suspense':
      return 'Suspense boundary present';
    case 'use-client':
      return "'use client' directive";
  }
}
