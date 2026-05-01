import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  PROVIDERS,
  stepKindTone,
  type ProviderId,
  type StepId,
} from './helpers';

export function OauthFlowVizOverlay() {
  const open = useUiStore((s) => s.overlays.oauthFlowViz.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [providerId, setProviderId] = useState<ProviderId>('google');
  const [showErrors, setShowErrors] = useState(false);
  const [stepId, setStepId] = useState<StepId>('redirect');
  const [callbackHost, setCallbackHost] = useState('https://app.example.com');
  const [callbackPath, setCallbackPath] = useState('/auth/callback');

  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]!;
  const step = provider.steps.find((s) => s.id === stepId) ?? provider.steps[0]!;
  const stepIndex = provider.steps.findIndex((s) => s.id === step.id);

  const callbackUrl = useMemo(
    () => `${callbackHost.replace(/\/$/, '')}${callbackPath.startsWith('/') ? '' : '/'}${callbackPath}`,
    [callbackHost, callbackPath],
  );

  const stateOk = true;
  const pkceOk = providerId !== 'github';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('oauthFlowViz')}
      title="OAuth flow visualizer"
      subtitle={`${provider.label} · ${provider.steps.length} steps`}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Copied authorize URL')}>
            Copy authorize URL
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Generated handler stub (mock)')}>
            Scaffold handler
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast('Saved provider config (mock)')}>
            Save config
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="tracking-caps text-ink-3">provider</span>
        <div className="flex flex-wrap items-center gap-1">
          {PROVIDERS.map((p) => (
            <ToggleChip
              key={p.id}
              active={providerId === p.id}
              onClick={() => {
                setProviderId(p.id);
                setStepId('redirect');
              }}
            >
              {p.label}
            </ToggleChip>
          ))}
        </div>
        <div className="ml-auto">
          <ToggleChip active={showErrors} onClick={() => setShowErrors((p) => !p)}>
            show errors
          </ToggleChip>
        </div>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <ScrollArea className="h-[560px]">
          <div className="space-y-3 p-3">
            <div className="rounded-sm border border-line bg-bg p-2">
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Flow
              </div>
              <FlowSvg
                stepIds={provider.steps.map((s) => ({ id: s.id, label: s.label, kind: s.kind }))}
                activeIndex={stepIndex}
                onClick={(id) => setStepId(id as StepId)}
              />
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-ink-2">
                <Chip tone={stepKindTone(step.kind)} size="xs">
                  {step.kind}
                </Chip>
                <span className="font-medium text-ink-1">{step.label}</span>
                <span className="text-ink-3">step {stepIndex + 1} / {provider.steps.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  Request
                </div>
                <div className="mt-1">
                  <CodeBlock code={step.request} language="http" maxHeight={220} />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  Response
                </div>
                <div className="mt-1">
                  <CodeBlock code={step.response} language="json" maxHeight={220} />
                </div>
              </div>
            </div>

            {step.urlParams.length > 0 ? (
              <div>
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  Expected params
                </div>
                <ul className="mt-1 space-y-0.5">
                  {step.urlParams.map((p) => (
                    <li
                      key={p.key}
                      className="flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1 text-xs"
                    >
                      <span className="font-mono text-ink-1">{p.key}</span>
                      <span className="font-mono text-ink-2">=</span>
                      <span className="truncate font-mono text-ink-2">{p.value}</span>
                      {p.note ? (
                        <span className="ml-auto text-[10px] text-ink-3">{p.note}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {showErrors && step.errors.length > 0 ? (
              <div>
                <div className="text-[10px] uppercase tracking-caps text-sev-err">
                  Common errors
                </div>
                <ul className="mt-1 space-y-0.5">
                  {step.errors.map((e) => (
                    <li
                      key={e}
                      className="rounded-sm border border-sev-err/30 bg-sev-err-soft px-2 py-1 font-mono text-[11px] text-sev-err"
                    >
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {/* Right rail */}
        <ScrollArea className="h-[560px]">
          <div className="space-y-3 p-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Callback URL builder
              </div>
              <div className="mt-1 space-y-1 rounded-sm border border-line bg-bg p-2">
                <input
                  type="text"
                  value={callbackHost}
                  onChange={(e) => setCallbackHost(e.target.value)}
                  className="h-6 w-full rounded-sm border border-line bg-bg px-1.5 font-mono text-[10px] text-ink-1 focus:outline-none"
                />
                <input
                  type="text"
                  value={callbackPath}
                  onChange={(e) => setCallbackPath(e.target.value)}
                  className="h-6 w-full rounded-sm border border-line bg-bg px-1.5 font-mono text-[10px] text-ink-1 focus:outline-none"
                />
                <div className="rounded-sm border border-dashed border-line bg-bg-subtle p-1.5 font-mono text-[10px] text-ink-1">
                  {callbackUrl}
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-line bg-bg p-2">
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Security
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                <Chip tone={stateOk ? 'static' : 'err'} size="xs">
                  state ok
                </Chip>
                <Chip tone={pkceOk ? 'static' : 'warn'} size="xs">
                  PKCE {pkceOk ? 'on' : 'unsupported'}
                </Chip>
                <Chip tone="info" size="xs">
                  S256
                </Chip>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Pitfalls
              </div>
              <ul className="mt-1 space-y-1">
                {provider.pitfalls.map((p) => (
                  <li
                    key={p}
                    className="rounded-sm border border-line bg-bg-subtle/60 px-2 py-1 text-[11px] text-ink-2"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-sm border border-line bg-bg p-2">
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Scopes
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {provider.scopes.map((s) => (
                  <Chip key={s} tone="muted" size="xs">
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

interface FlowSvgProps {
  stepIds: ReadonlyArray<{ id: string; label: string; kind: string }>;
  activeIndex: number;
  onClick(id: string): void;
}

function FlowSvg({ stepIds, activeIndex, onClick }: FlowSvgProps) {
  const w = 880;
  const h = 130;
  const nodeW = 110;
  const nodeH = 56;
  const total = stepIds.length;
  const gap = (w - total * nodeW) / Math.max(total - 1, 1);
  const yMid = h / 2;

  function fillForKind(kind: string, active: boolean): string {
    if (active) {
      return kind === 'browser'
        ? 'fill-sev-info-soft'
        : kind === 'your-server'
          ? 'fill-accent-soft'
          : kind === 'provider'
            ? 'fill-sem-static-soft'
            : 'fill-sev-warn-soft';
    }
    return 'fill-bg';
  }

  function strokeForKind(kind: string, active: boolean): string {
    if (active) {
      return kind === 'browser'
        ? 'stroke-sev-info'
        : kind === 'your-server'
          ? 'stroke-accent'
          : kind === 'provider'
            ? 'stroke-sem-static'
            : 'stroke-sev-warn';
    }
    return 'stroke-line';
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" style={{ height: h }}>
      <defs>
        <marker
          id="ofv-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" className="fill-ink-3" />
        </marker>
      </defs>
      {stepIds.map((s, i) => {
        const x = i * (nodeW + gap);
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <g key={s.id}>
            {i < total - 1 ? (
              <line
                x1={x + nodeW}
                y1={yMid}
                x2={x + nodeW + gap}
                y2={yMid}
                className={isPast ? 'stroke-accent' : 'stroke-line'}
                strokeWidth={isPast ? 1.5 : 1}
                markerEnd="url(#ofv-arrow)"
              />
            ) : null}
            <g
              className="cursor-pointer"
              onClick={() => onClick(s.id)}
            >
              <rect
                x={x}
                y={yMid - nodeH / 2}
                width={nodeW}
                height={nodeH}
                rx={4}
                className={cn(
                  fillForKind(s.kind, isActive || isPast),
                  strokeForKind(s.kind, isActive),
                )}
                strokeWidth={isActive ? 1.5 : 0.75}
              />
              <text
                x={x + nodeW / 2}
                y={yMid - 6}
                textAnchor="middle"
                fontSize={10}
                className="fill-ink-3"
              >
                {s.kind}
              </text>
              <text
                x={x + nodeW / 2}
                y={yMid + 10}
                textAnchor="middle"
                fontSize={11}
                className={cn('font-medium', isActive ? 'fill-ink-1' : 'fill-ink-2')}
              >
                {s.label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
