/**
 * Phase 6 — "Why is this broken?" (23-1).
 *
 * Renders a button + Popover that explains the root-cause chain for a
 * selected diagnostic. Leverages admission Findings' witness chains
 * (Phase 5 puts TaintPath edges in Finding.witness) when available, and
 * falls back to the Diagnostic's `evidence` array.
 *
 * The button is intentionally permissive: if there are no risks selected
 * it renders disabled with helpful copy so the user understands what would
 * appear here.
 */

import { useMemo } from 'react';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useEvidenceStore } from '@entities/evidence';
import {
  Button,
  Chip,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { Finding } from '@entities/evidence';
import type { Diagnostic } from '@shared/types';
import type { RiskRef } from './types';

interface ChainNode {
  label: string;
  file: string;
  line: number;
  detail?: string;
  kind: 'source' | 'edge' | 'sink';
}

interface Props {
  /** Risks already aggregated by the hover. Optional. */
  risks?: RiskRef[];
  /** A specific diagnostic id (overrides risks). */
  diagnosticId?: string;
  /** Visual override — button can be inline or icon-only. */
  variant?: 'inline' | 'icon';
}

export function WhyBrokenButton({ risks, diagnosticId, variant = 'inline' }: Props) {
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const findings = useEvidenceStore((s) => s.packets.flatMap((p) => p.findings));
  const openTab = useEditorStore((s) => s.openTab);

  // Resolve target — preference order: explicit diagnosticId, first risk.
  const target = useMemo(() => {
    if (diagnosticId) {
      const d = diagnostics.find((x) => x.id === diagnosticId);
      if (d) return { kind: 'diagnostic' as const, value: d };
      const f = findings.find((x) => x.id === diagnosticId);
      if (f) return { kind: 'finding' as const, value: f };
    }
    const first = (risks ?? [])[0];
    if (!first) return null;
    if (first.fromAdmission) {
      const f = findings.find((x) => x.id === first.id);
      if (f) return { kind: 'finding' as const, value: f };
    }
    const d = diagnostics.find((x) => x.id === first.id);
    return d ? { kind: 'diagnostic' as const, value: d } : null;
  }, [diagnosticId, risks, diagnostics, findings]);

  const chain = useMemo<ChainNode[]>(() => {
    if (!target) return [];
    if (target.kind === 'finding') return findingToChain(target.value);
    return diagnosticToChain(target.value);
  }, [target]);

  const disabled = !target || chain.length === 0;

  const trigger =
    variant === 'icon' ? (
      <Button size="icon" tone="ghost" aria-label="Why is this broken?" disabled={disabled}>
        <Icon.Net className="h-3.5 w-3.5" />
      </Button>
    ) : (
      <Button size="xs" tone="ghost" disabled={disabled} aria-label="Why is this broken?">
        <Icon.Net className="h-3 w-3" />
        Why?
      </Button>
    );

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[420px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {target ? (
          <div className="flex flex-col">
            <header className="px-3 py-2 hairline-b">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-caps text-ink-3">
                  root cause
                </span>
                <Chip tone={target.kind === 'finding' ? 'warn' : 'err'} size="xs">
                  {target.kind === 'finding' ? 'admission' : 'diagnostic'}
                </Chip>
                <span className="ml-auto truncate font-mono text-[11px] text-ink-3">
                  {target.kind === 'finding' ? target.value.ruleId : target.value.ruleId}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-medium text-ink-1">
                {target.kind === 'finding' ? target.value.message : target.value.title}
              </div>
            </header>
            <ScrollArea className="max-h-[280px]">
              <ol className="flex flex-col gap-0 py-1">
                {chain.map((n, i) => (
                  <li key={`${n.file}:${n.line}:${i}`} className="relative px-3 py-1.5">
                    {/* Connector */}
                    {i < chain.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute left-[18px] top-7 h-[calc(100%-12px)] w-px bg-line"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        openTab({
                          id: `tab-${n.file.replace(/[^a-zA-Z0-9]/g, '-')}`,
                          file: n.file,
                          label: n.file.split('/').pop() ?? n.file,
                        });
                      }}
                      className="group flex w-full items-start gap-2 rounded-sm px-1 py-1 text-left hover:bg-bg-hover focus-visible:bg-bg-hover focus-visible:outline-none"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-bg',
                          n.kind === 'source' && 'bg-sev-warn',
                          n.kind === 'edge' && 'bg-ink-3',
                          n.kind === 'sink' && 'bg-sev-err',
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] text-ink-1">{n.label}</span>
                        {n.detail ? (
                          <span className="block truncate text-[10px] text-ink-3">{n.detail}</span>
                        ) : null}
                        <span className="block truncate font-mono text-[10px] text-ink-3">
                          {n.file}:{n.line}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </ScrollArea>
            <footer className="px-3 py-1.5 hairline-t bg-bg-subtle/60 text-[10px] text-ink-3">
              {chain.length} step{chain.length === 1 ? '' : 's'} in chain · click to jump
            </footer>
          </div>
        ) : (
          <div className="px-3 py-3 text-[12px] text-ink-3">
            Select a diagnostic to see its witness chain.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Chain builders
// ─────────────────────────────────────────────────────────────────────────

function diagnosticToChain(d: Diagnostic): ChainNode[] {
  // Use the diagnostic's evidence list — already file:line prepared by
  // existing analyzers. Mark the first as source, last as sink.
  const evidences = d.evidence ?? [];
  if (evidences.length === 0) {
    return [
      {
        label: d.title,
        file: d.location.file,
        line: d.location.line,
        kind: 'sink',
        detail: d.message,
      },
    ];
  }
  return evidences.map((e, i) => ({
    label: e.label,
    file: e.location?.file ?? d.location.file,
    line: e.location?.line ?? d.location.line,
    detail: e.kind,
    kind: i === 0 ? 'source' : i === evidences.length - 1 ? 'sink' : 'edge',
  }));
}

function findingToChain(f: Finding): ChainNode[] {
  const w = f.witness;
  if (!w) {
    return [
      {
        label: f.message,
        file: f.filePath,
        line: f.line ?? 1,
        kind: 'sink',
      },
    ];
  }
  if (Array.isArray(w)) {
    // string[] — each string is "file:line — note"; do best-effort parse.
    return w.map<ChainNode>((s, i) => {
      const m = /^(.+?):(\d+)(?:\s+—\s+(.*))?$/.exec(s);
      if (m) {
        return {
          label: m[3] ?? s,
          file: m[1] ?? f.filePath,
          line: Number(m[2]) || 1,
          kind: i === 0 ? 'source' : i === w.length - 1 ? 'sink' : 'edge',
        };
      }
      return {
        label: s,
        file: f.filePath,
        line: f.line ?? 1,
        kind: i === 0 ? 'source' : 'edge',
      };
    });
  }
  // TaintPath: { source, sink, edges }
  const src = w.source;
  const sink = w.sink;
  const out: ChainNode[] = [];
  out.push({
    label: `source · ${src.kind}: ${src.expr}`,
    file: src.file,
    line: src.node?.line ?? 1,
    kind: 'source',
  });
  for (const e of w.edges ?? []) {
    out.push({
      label: e.note ?? `flows via ${e.kind}`,
      file: e.to?.file ?? src.file,
      line: e.to?.line ?? 1,
      kind: 'edge',
    });
  }
  out.push({
    label: `sink · ${sink.kind}`,
    file: sink.file,
    line: sink.node?.line ?? 1,
    kind: 'sink',
  });
  return out;
}
