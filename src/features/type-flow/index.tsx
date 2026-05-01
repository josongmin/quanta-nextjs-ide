import { useEffect, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  findFlow,
  symbolFlows,
  type FlowField,
  type FlowIssue,
  type FlowStage,
  type SerializationRisk,
} from './helpers';

const RISK_TONES: Record<SerializationRisk, 'warn' | 'err' | 'muted'> = {
  Date: 'warn',
  Function: 'err',
  Map: 'warn',
  Set: 'warn',
  Decimal: 'warn',
  Buffer: 'err',
};

export function TypeFlowOverlay() {
  const open = useUiStore((s) => s.overlays.typeFlow.open);
  const storedSymbol = useUiStore((s) => s.overlays.typeFlow.symbolId);
  const close = useUiStore((s) => s.closeOverlay);

  const [symbolId, setSymbolId] = useState<string>(
    storedSymbol ?? symbolFlows[0]!.id,
  );

  useEffect(() => {
    if (storedSymbol) setSymbolId(storedSymbol);
  }, [storedSymbol]);

  const flow = findFlow(symbolId);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('typeFlow'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Net className="h-4 w-4 text-ink-3" />
          <span>Type Flow</span>
        </span>
      }
      subtitle="server → client serialization tracer"
      size="md"
      footer={
        <>
          <Button
            size="sm"
            tone="ghost"
            onClick={() =>
              toast('Generated DTO suggestion', {
                description: `Pick<>/Omit<> derivation for ${flow.label}`,
              })
            }
          >
            <Icon.Bulb className="h-3 w-3" /> Suggest DTO
          </Button>
          <Button size="sm" tone="ghost" onClick={() => close('typeFlow')}>
            Close
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 px-4 py-2 hairline-b">
        <label className="flex items-center gap-1.5 text-[11px] text-ink-3">
          <span className="text-caps">Symbol</span>
          <select
            value={symbolId}
            onChange={(e) => setSymbolId(e.target.value)}
            className={cn(
              'rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1',
              'focus:outline-2 focus:outline-accent',
            )}
          >
            {symbolFlows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <Chip tone="muted" size="xs" className="font-normal normal-case">
          {flow.kind}
        </Chip>
        <span className="ml-auto text-[10px] text-ink-3">
          fields with serialization risk are highlighted
        </span>
      </div>

      <div className="grid grid-cols-3 gap-0 divide-x divide-line">
        <StageColumn stage={flow.source} tone="server" position="left" />
        <StageColumn stage={flow.server} tone="server" position="middle" />
        <StageColumn stage={flow.client} tone="client" position="right" />
      </div>

      <IssuesPanel issues={flow.issues} />
    </OverlayPanel>
  );
}

function StageColumn({
  stage,
  tone,
  position,
}: {
  stage: FlowStage;
  tone: 'server' | 'client';
  position: 'left' | 'middle' | 'right';
}) {
  return (
    <section className="relative min-w-0 px-3 py-3">
      {/* arrow indicator from previous column */}
      {position !== 'left' ? (
        <span
          aria-hidden
          className="absolute -left-2 top-6 inline-flex h-4 w-4 items-center justify-center rounded-full border border-line bg-bg text-ink-3"
        >
          <Icon.Right className="h-3 w-3" />
        </span>
      ) : null}
      <header className="mb-2">
        <div className="flex items-center gap-1.5">
          <Chip tone={tone === 'client' ? 'client' : 'server'} size="xs">
            {tone === 'client' ? 'CLIENT' : 'SERVER'}
          </Chip>
          <span className="text-caps text-ink-3">{stage.label}</span>
        </div>
        <div className="mt-1 truncate font-mono text-[12px] text-ink-1">
          {stage.symbol}
        </div>
        <div className="truncate font-mono text-[10px] text-ink-3">
          {stage.file}
        </div>
        <div className="mt-1 text-[11px] text-ink-2">{stage.description}</div>
      </header>
      <ul className="mt-2 space-y-0.5">
        {stage.fields.map((f) => (
          <FieldRow key={`${stage.symbol}-${f.name}`} field={f} />
        ))}
      </ul>
    </section>
  );
}

function FieldRow({ field }: { field: FlowField }) {
  return (
    <li
      className={cn(
        'flex items-center gap-1.5 rounded-sm px-1 py-0.5 font-mono text-[11px]',
        field.exposed && 'bg-sev-err-soft/40',
      )}
    >
      <span className="min-w-0 flex-1 truncate text-ink-1">
        {field.name}
        <span className="text-ink-3">: </span>
        <span className="text-ink-2">{field.type}</span>
      </span>
      {field.risk ? (
        <Chip
          tone={RISK_TONES[field.risk]}
          size="xs"
          className="font-normal normal-case tracking-normal"
        >
          {field.risk}
        </Chip>
      ) : null}
      {field.exposed ? (
        <Chip tone="err" size="xs" className="font-normal normal-case tracking-normal">
          exposed
        </Chip>
      ) : null}
    </li>
  );
}

function IssuesPanel({ issues }: { issues: readonly FlowIssue[] }) {
  return (
    <section className="px-4 py-3 hairline-t">
      <header className="mb-1.5 flex items-center justify-between">
        <h3 className="text-caps text-ink-3">
          Serialization warnings ({issues.length})
        </h3>
        <Chip tone="muted" size="xs" className="font-normal normal-case">
          rendered as static analysis only
        </Chip>
      </header>
      {issues.length === 0 ? (
        <p className="text-[11px] text-ink-3">No issues detected on this flow.</p>
      ) : (
        <ul className="space-y-1">
          {issues.map((issue, idx) => (
            <li
              key={idx}
              className={cn(
                'flex items-start gap-2 rounded-sm border px-2 py-1.5',
                match(issue.severity)
                  .with('err', () => 'border-sev-err/30 bg-sev-err-soft/40')
                  .with('warn', () => 'border-sev-warn/30 bg-sev-warn-soft/40')
                  .with('info', () => 'border-line bg-bg-subtle')
                  .exhaustive(),
              )}
            >
              {match(issue.severity)
                .with('err', () => (
                  <Icon.XCircle className="h-3.5 w-3.5 shrink-0 text-sev-err" />
                ))
                .with('warn', () => (
                  <Icon.Alert className="h-3.5 w-3.5 shrink-0 text-sev-warn" />
                ))
                .with('info', () => (
                  <Icon.Info className="h-3.5 w-3.5 shrink-0 text-sev-info" />
                ))
                .exhaustive()}
              <div className="min-w-0">
                <div className="text-[12px] text-ink-1">{issue.message}</div>
                {issue.detail ? (
                  <div className="text-[11px] text-ink-3">{issue.detail}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
