import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { selectDiagnosticById, useDiagnosticStore } from '@entities/diagnostic';
import { useRouteStore } from '@entities/route';
import type { Diagnostic, QuickFix } from '@shared/types';
import {
  Button,
  Chip,
  ConfidenceDot,
  Icon,
  OverlayPanel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Section,
  SeverityLabel,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { findRelatedDiagnostics, synthesizePreview } from './helpers';

type MuteScope = 'line' | 'file' | 'route' | 'project';

const MUTE_SCOPES: ReadonlyArray<{ value: MuteScope; label: string; hint: string }> = [
  { value: 'line', label: 'This line', hint: 'mutes this single diagnostic' },
  { value: 'file', label: 'This file', hint: 'mutes this diagnostic in the current file' },
  { value: 'route', label: 'This route', hint: 'mutes the rule for the current route' },
  { value: 'project', label: 'Whole project', hint: 'mutes the rule everywhere' },
];

function confidenceLabel(c: Diagnostic['confidence']): string {
  return match(c)
    .with('high', () => 'High')
    .with('medium', () => 'Medium')
    .with('low', () => 'Low')
    .exhaustive();
}

function confidenceReason(d: Diagnostic): string {
  if (d.evidence.length === 0) return 'No evidence captured.';
  const direct = d.evidence.filter((e) => e.kind === 'direct').length;
  const indirect = d.evidence.filter((e) => e.kind === 'indirect').length;
  const heuristic = d.evidence.filter((e) => e.kind === 'heuristic').length;
  const parts: string[] = [];
  if (direct) parts.push(`${direct} direct`);
  if (indirect) parts.push(`${indirect} indirect`);
  if (heuristic) parts.push(`${heuristic} heuristic`);
  return parts.join(' · ');
}

function DiffBlock({
  before,
  after,
  synthetic,
}: {
  before: string;
  after: string;
  synthetic: boolean;
}) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  return (
    <div className="overflow-hidden rounded-sm border border-line">
      {synthetic ? (
        <div className="hairline-b bg-bg-subtle px-2 py-1 text-[10px] uppercase tracking-caps text-ink-3">
          no preview available — synthetic stub
        </div>
      ) : null}
      <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-2 md:divide-y-0 md:divide-x">
        <div>
          <div className="hairline-b bg-sev-err-soft/60 px-2 py-1 text-[10px] uppercase tracking-caps text-sev-err">
            before
          </div>
          <pre className="overflow-x-auto px-2 py-1.5 font-mono text-[11px] leading-5 text-sev-err bg-sev-err-soft/30">
            {beforeLines.map((l, i) => (
              <div key={i} className="whitespace-pre">
                <span className="select-none text-ink-3">{`${(i + 1).toString().padStart(2, ' ')} `}</span>
                <span>{`- ${l}`}</span>
              </div>
            ))}
          </pre>
        </div>
        <div>
          <div className="hairline-b bg-sem-static/10 px-2 py-1 text-[10px] uppercase tracking-caps text-sem-static">
            after
          </div>
          <pre className="overflow-x-auto px-2 py-1.5 font-mono text-[11px] leading-5 text-sem-static bg-sem-static/5">
            {afterLines.map((l, i) => (
              <div key={i} className="whitespace-pre">
                <span className="select-none text-ink-3">{`${(i + 1).toString().padStart(2, ' ')} `}</span>
                <span>{`+ ${l}`}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}

function MutePopover({
  diagnostic,
  onConfirm,
}: {
  diagnostic: Diagnostic;
  onConfirm(scope: MuteScope, reason: string): void;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<MuteScope | null>(null);
  const [reason, setReason] = useState('');

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setScope(null);
          setReason('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button size="sm" tone="ghost">
          <Icon.X className="h-3 w-3" />
          Mute
          <Icon.ChevDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[300px] p-2 text-xs"
      >
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
          Mute scope
        </div>
        <div className="grid grid-cols-2 gap-1">
          {MUTE_SCOPES.map((s) => {
            const active = scope === s.value;
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={active}
                onClick={() => setScope(s.value)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-sm border px-2 py-1 text-left',
                  active
                    ? 'border-accent bg-accent-soft/40 text-ink-1'
                    : 'border-line bg-bg text-ink-1 hover:bg-bg-hover',
                )}
              >
                <span className="text-xs font-medium">{s.label}</span>
                <span className="text-[10px] text-ink-3">{s.hint}</span>
              </button>
            );
          })}
        </div>

        {scope ? (
          <>
            <div className="mt-2 text-[10px] uppercase tracking-caps text-ink-3">
              Reason (optional)
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this acceptable?"
              rows={3}
              className="mt-1 w-full resize-none rounded-sm border border-line bg-bg px-2 py-1 text-xs text-ink-1 placeholder:text-ink-3 focus:outline-2 focus:outline-accent"
            />
            <div className="mt-2 flex items-center justify-end gap-1">
              <Button
                size="xs"
                tone="ghost"
                onClick={() => {
                  setOpen(false);
                  setScope(null);
                  setReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                tone="accent"
                onClick={() => {
                  onConfirm(scope, reason);
                  setOpen(false);
                  setScope(null);
                  setReason('');
                }}
              >
                Confirm mute
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[11px] text-ink-3">
            Pick a scope to continue. Rule:{' '}
            <span className="font-mono text-ink-2">{diagnostic.ruleId}</span>
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function PatchPreviewOverlay() {
  const overlay = useUiStore((s) => s.overlays.patchPreview);
  const closeOverlay = useUiStore((s) => s.closeOverlay);

  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const muteRule = useDiagnosticStore((s) => s.muteRule);
  const muteDiagnostic = useDiagnosticStore((s) => s.muteDiagnostic);
  const routes = useRouteStore((s) => s.routes);

  const diagnostic = useDiagnosticStore(
    selectDiagnosticById(overlay.diagnosticId ?? ''),
  ) as Diagnostic | undefined;

  const fix: QuickFix | undefined = useMemo(() => {
    if (!diagnostic) return undefined;
    if (overlay.fixId) {
      return diagnostic.fixes.find((f) => f.id === overlay.fixId) ?? diagnostic.fixes[0];
    }
    return diagnostic.fixes[0];
  }, [diagnostic, overlay.fixId]);

  const related = useMemo(
    () => (diagnostic ? findRelatedDiagnostics(diagnostic, diagnostics) : []),
    [diagnostic, diagnostics],
  );

  const affectedRoutes = useMemo(() => {
    if (!diagnostic) return [];
    const ids = new Set(diagnostic.affectedRouteIds);
    return routes.filter((r) => ids.has(r.id));
  }, [diagnostic, routes]);

  const close = () => closeOverlay('patchPreview');

  const subtitle = diagnostic ? (
    <span className="flex items-center gap-1.5">
      <span className="truncate text-ink-1">{diagnostic.title}</span>
      <span className="text-ink-3">·</span>
      <span className="truncate text-ink-3">{diagnostic.scope || '(no scope)'}</span>
      <span className="text-ink-3">·</span>
      <span className="font-mono text-ink-3">{diagnostic.ruleId}</span>
    </span>
  ) : (
    'No diagnostic selected'
  );

  const synthetic = !fix?.preview;
  const preview =
    fix && diagnostic
      ? fix.preview ?? synthesizePreview(diagnostic, fix)
      : { before: '', after: '' };

  const handleApply = () => {
    if (!diagnostic || !fix) return;
    toast.success('Applied (mock)', {
      description: `${fix.title} · ${diagnostic.location.file}:${diagnostic.location.line}`,
    });
    close();
  };

  const handleApplyAll = () => {
    if (!diagnostic || !fix) return;
    const count = related.length + 1;
    toast.success(`Applied to ${count} site${count === 1 ? '' : 's'} (mock)`, {
      description: `Rule ${diagnostic.ruleId}`,
    });
    close();
  };

  const handleMute = (scope: MuteScope, reason: string) => {
    if (!diagnostic) return;
    if (scope === 'line' || scope === 'file') {
      muteDiagnostic(diagnostic.id);
    } else {
      muteRule(diagnostic.ruleId);
    }
    toast.success(`Muted (${scope})`, {
      description: reason
        ? `${diagnostic.ruleId} — ${reason}`
        : diagnostic.ruleId,
    });
  };

  return (
    <OverlayPanel
      open={overlay.open}
      onOpenChange={(o) => (o ? null : close())}
      title="Patch Preview"
      subtitle={subtitle}
      size="sm"
      footer={
        diagnostic && fix ? (
          <div className="flex w-full items-center justify-between gap-2">
            <Button size="sm" tone="ghost" onClick={close}>
              Cancel
            </Button>
            <div className="flex items-center gap-1.5">
              <MutePopover diagnostic={diagnostic} onConfirm={handleMute} />
              {fix.applyToAll ? (
                <Button size="sm" tone="default" onClick={handleApplyAll}>
                  <Icon.Layers className="h-3 w-3" />
                  Apply to all similar ({related.length + 1})
                </Button>
              ) : null}
              <Button size="sm" tone="accent" onClick={handleApply}>
                <Icon.Bulb className="h-3 w-3" />
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-end">
            <Button size="sm" tone="ghost" onClick={close}>
              Close
            </Button>
          </div>
        )
      }
    >
      {diagnostic && fix ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 hairline-b bg-bg-subtle">
            <Chip tone="accent" size="sm" className="font-mono">
              {fix.title}
            </Chip>
            {fix.description ? (
              <span className="truncate text-[11px] text-ink-3">
                {fix.description}
              </span>
            ) : null}
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-ink-3">
              <SeverityLabel severity={diagnostic.severity} />
              <span>·</span>
              <ConfidenceDot confidence={diagnostic.confidence} />
              <span>{confidenceLabel(diagnostic.confidence)}</span>
            </span>
          </div>

          <Section title="Diff" defaultOpen>
            <DiffBlock
              before={preview.before}
              after={preview.after}
              synthetic={synthetic}
            />
          </Section>

          {fix.preview && fix.preview.behaviorDiff.length > 0 ? (
            <Section title="Behavior change" defaultOpen>
              <table className="w-full font-mono text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-caps text-ink-3">
                    <th className="w-32 py-1 text-left">field</th>
                    <th className="py-1 text-left">before</th>
                    <th className="w-6 py-1 text-center"> </th>
                    <th className="py-1 text-left">after</th>
                  </tr>
                </thead>
                <tbody>
                  {fix.preview.behaviorDiff.map((row) => (
                    <tr key={row.field} className="hairline-t">
                      <td className="py-1 pr-2 text-ink-3">{row.field}</td>
                      <td className="py-1 text-ink-2 line-through">{row.before}</td>
                      <td className="px-1 py-1 text-center text-ink-3">→</td>
                      <td className="py-1 text-ink-1">{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          ) : null}

          <Section
            title={`Affected (${affectedRoutes.length})`}
            defaultOpen={affectedRoutes.length > 0}
          >
            {affectedRoutes.length === 0 ? (
              <div className="text-xs text-ink-3">
                No additional routes affected. The fix is local to{' '}
                <span className="font-mono text-ink-2">
                  {diagnostic.location.file}:{diagnostic.location.line}
                </span>
                .
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5 text-xs">
                {affectedRoutes.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-1.5 hairline-b py-1 last:border-b-0"
                  >
                    <Icon.Globe className="h-3 w-3 text-ink-3" />
                    <span className="font-mono text-ink-1">{r.path}</span>
                    <Chip tone="muted" size="xs" className="ml-auto">
                      {r.rendering}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Confidence" defaultOpen>
            <div className="flex items-start gap-2 text-xs">
              <ConfidenceDot confidence={diagnostic.confidence} size="md" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-ink-1">
                  {confidenceLabel(diagnostic.confidence)}
                </div>
                <div className="mt-0.5 text-ink-3">{confidenceReason(diagnostic)}</div>
                {diagnostic.confidence !== 'high' ? (
                  <div className="mt-1.5 rounded-sm border border-sev-warn/30 bg-sev-warn-soft/40 px-2 py-1 text-[11px] text-sev-warn">
                    Review carefully — Medium/Low confidence may need manual
                    verification.
                  </div>
                ) : null}
              </div>
            </div>
          </Section>
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-ink-3">
          No diagnostic selected — open this overlay from a diagnostic in the
          Problems panel.
        </div>
      )}
    </OverlayPanel>
  );
}
