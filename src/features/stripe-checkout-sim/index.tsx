import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  CART,
  CURRENCIES,
  JURISDICTIONS,
  PAYMENT_METHODS,
  SCENARIOS,
  buildPaymentIntent,
  cartSubtotalUsdMinor,
  convertMinor,
  formatMoney,
  scenarioToneFill,
  type Currency,
  type PaymentMethod,
  type ScenarioId,
} from './helpers';

interface RefundEntry {
  readonly id: string;
  readonly amount: number;
  readonly note: string;
  readonly when: string;
}

export function StripeCheckoutSimOverlay() {
  const open = useUiStore((s) => s.overlays.stripeCheckoutSim.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [scenarioId, setScenarioId] = useState<ScenarioId>('success');
  const [currencyCode, setCurrencyCode] = useState<Currency>('USD');
  const [jurisdictionId, setJurisdictionId] = useState<string>('us-ca');
  const [methodId, setMethodId] = useState<PaymentMethod>('card');
  const [stepIndex, setStepIndex] = useState(0);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refunds, setRefunds] = useState<ReadonlyArray<RefundEntry>>([
    { id: 're_001', amount: 500, note: 'partial — sock pack', when: '04-30 09:14' },
  ]);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]!;
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0]!;
  const jurisdiction =
    JURISDICTIONS.find((j) => j.id === jurisdictionId) ?? JURISDICTIONS[0]!;

  const subtotalUsd = useMemo(() => cartSubtotalUsdMinor(), []);
  const subtotal = convertMinor(subtotalUsd, currency);
  const taxMinor = Math.round(subtotal * jurisdiction.rate);
  const totalMinor = subtotal + taxMinor;

  const cartJson = useMemo(
    () =>
      JSON.stringify(
        {
          currency: currency.code.toLowerCase(),
          line_items: CART.map((item) => ({
            sku: item.sku,
            description: item.name,
            quantity: item.qty,
            unit_amount: convertMinor(item.unitAmount, currency),
          })),
          subtotal,
          tax: taxMinor,
          total: totalMinor,
        },
        null,
        2,
      ),
    [currency, subtotal, taxMinor, totalMinor],
  );

  const intentJson = useMemo(
    () => buildPaymentIntent(scenario, currency, jurisdiction, methodId, totalMinor),
    [scenario, currency, jurisdiction, methodId, totalMinor],
  );

  const safeStepIndex = Math.min(stepIndex, scenario.steps.length - 1);

  function nextStep() {
    setStepIndex((p) => Math.min(p + 1, scenario.steps.length - 1));
    toast(`Advanced to ${scenario.steps[Math.min(stepIndex + 1, scenario.steps.length - 1)]?.label ?? 'done'}`);
  }

  function issueRefund() {
    const n = Number(refundAmount);
    if (!n || n <= 0) {
      toast('Enter a refund amount');
      return;
    }
    setRefunds((prev) => [
      ...prev,
      {
        id: `re_${Math.random().toString(36).slice(2, 8)}`,
        amount: Math.round(n * currency.minor),
        note: n * currency.minor >= totalMinor ? 'full refund' : 'partial refund',
        when: '05-01 now',
      },
    ]);
    setRefundAmount('');
    toast(`Issued ${formatMoney(Math.round(n * currency.minor), currency)} refund (mock)`);
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('stripeCheckoutSim')}
      title="Stripe checkout simulator"
      subtitle={`${scenario.label} · ${currency.code} · ${jurisdiction.label}`}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Saved scenario as fixture')}>
            Save fixture
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Copied curl request')}>
            Copy curl
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast('Opened Stripe dashboard (mock)')}>
            View in dashboard
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="tracking-caps text-ink-3">scenario</span>
        <div className="flex flex-wrap items-center gap-1">
          {SCENARIOS.map((s) => (
            <ToggleChip
              key={s.id}
              active={scenarioId === s.id}
              onClick={() => {
                setScenarioId(s.id);
                setStepIndex(0);
              }}
            >
              {s.label}
            </ToggleChip>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SelectControl
            label="ccy"
            value={currencyCode}
            onChange={(v) => setCurrencyCode(v)}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
          <SelectControl
            label="tax"
            value={jurisdictionId}
            onChange={(v) => setJurisdictionId(v)}
            options={JURISDICTIONS.map((j) => ({ value: j.id, label: j.label }))}
          />
          <SelectControl
            label="method"
            value={methodId}
            onChange={(v) => setMethodId(v)}
            options={PAYMENT_METHODS.map((m) => ({ value: m.id, label: m.label }))}
          />
        </div>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <ScrollArea className="h-[560px]">
          <div className="grid grid-cols-2 gap-3 p-3">
            {/* Left: cart */}
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  Cart payload
                </div>
                <div className="mt-1">
                  <CodeBlock code={cartJson} language="json" maxHeight={220} />
                </div>
              </div>
              <div className="rounded-sm border border-line bg-bg p-2">
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  Tax breakdown
                </div>
                <dl className="mt-1 space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-ink-2">Subtotal</dt>
                    <dd className="font-mono text-ink-1">
                      {formatMoney(subtotal, currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-2">
                      {jurisdiction.type.toUpperCase()} ({(jurisdiction.rate * 100).toFixed(2)}%)
                    </dt>
                    <dd className="font-mono text-ink-1">
                      {formatMoney(taxMinor, currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1">
                    <dt className="font-medium text-ink-1">Total</dt>
                    <dd className="font-mono font-semibold text-ink-1">
                      {formatMoney(totalMinor, currency)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-2">
                  <Chip tone={scenario.tone === 'err' ? 'err' : 'accent'} size="xs">
                    {formatMoney(totalMinor, currency)} · {currency.code}
                  </Chip>
                </div>
              </div>
            </div>

            {/* Right: SVG step diagram */}
            <div className="space-y-3">
              <div className="rounded-sm border border-line bg-bg p-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Flow
                  </div>
                  <Chip tone={scenario.tone} size="xs">
                    {scenario.label}
                  </Chip>
                </div>
                <StepDiagram
                  steps={scenario.steps}
                  activeIndex={safeStepIndex}
                  toneFill={scenarioToneFill(scenario.tone).fill}
                  toneStroke={scenarioToneFill(scenario.tone).stroke}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-ink-2">
                    {scenario.steps[safeStepIndex]?.description ?? ''}
                  </div>
                  <Button
                    size="xs"
                    tone="default"
                    disabled={safeStepIndex >= scenario.steps.length - 1}
                    onClick={nextStep}
                  >
                    Advance step
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  PaymentIntent payload
                </div>
                <div className="mt-1">
                  <CodeBlock code={intentJson} language="json" maxHeight={260} />
                </div>
                <div className="mt-1 text-[11px] text-ink-3">
                  {scenario.outcomeMessage}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Right rail: refund flow */}
        <ScrollArea className="h-[560px]">
          <div className="space-y-3 p-3">
            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Refund flow
              </div>
              <div className="mt-1 rounded-sm border border-line bg-bg p-2 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={`amount (${currency.code})`}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="h-6 min-w-0 flex-1 rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-1 placeholder:text-ink-3 focus:outline-none"
                  />
                  <Button
                    size="xs"
                    tone="ghost"
                    onClick={() =>
                      setRefundAmount(String(totalMinor / currency.minor))
                    }
                  >
                    full
                  </Button>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <Button size="xs" tone="accent" onClick={issueRefund}>
                    Issue refund (mock)
                  </Button>
                  <span className="text-[10px] text-ink-3">
                    cap {formatMoney(totalMinor, currency)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Refund timeline
              </div>
              <ol className="mt-1 space-y-1">
                {refunds.length === 0 ? (
                  <li className="rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-2 text-center text-[11px] text-ink-3">
                    No refunds yet.
                  </li>
                ) : (
                  refunds.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-sm border border-line bg-bg p-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-ink-1">{r.id}</span>
                        <span className="font-mono text-ink-1">
                          {formatMoney(r.amount, currency)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-[10px] text-ink-3">
                        <span>{r.note}</span>
                        <span>{r.when}</span>
                      </div>
                    </li>
                  ))
                )}
              </ol>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Method
              </div>
              <div className="mt-1 rounded-sm border border-line bg-bg p-2 text-xs">
                <div className="font-medium text-ink-1">
                  {PAYMENT_METHODS.find((m) => m.id === methodId)?.label}
                </div>
                <div className="text-[11px] text-ink-3">
                  {PAYMENT_METHODS.find((m) => m.id === methodId)?.description}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {PAYMENT_METHODS.find((m) => m.id === methodId)?.currencies.map(
                    (c) => (
                      <Chip key={c} tone="muted" size="xs">
                        {c}
                      </Chip>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

interface StepDiagramProps {
  steps: ReadonlyArray<{ id: string; label: string }>;
  activeIndex: number;
  toneFill: string;
  toneStroke: string;
}

function StepDiagram({ steps, activeIndex, toneFill, toneStroke }: StepDiagramProps) {
  const w = 460;
  const h = 80;
  const nodeW = 80;
  const nodeH = 36;
  const gap = (w - steps.length * nodeW) / Math.max(steps.length - 1, 1);
  const yMid = h / 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 block w-full" style={{ height: h }}>
      {steps.map((s, i) => {
        const x = i * (nodeW + gap);
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <g key={s.id}>
            {i < steps.length - 1 ? (
              <line
                x1={x + nodeW}
                y1={yMid}
                x2={x + nodeW + gap}
                y2={yMid}
                className={cn(isPast ? toneStroke : 'stroke-line')}
                strokeWidth={isPast ? 1.5 : 1}
                markerEnd="url(#sca-arrow)"
              />
            ) : null}
            <rect
              x={x}
              y={yMid - nodeH / 2}
              width={nodeW}
              height={nodeH}
              rx={4}
              className={cn(
                isActive ? toneFill : isPast ? 'fill-bg-subtle' : 'fill-bg',
                isActive ? toneStroke : 'stroke-line',
              )}
              strokeWidth={isActive ? 1.5 : 0.75}
            />
            <text
              x={x + nodeW / 2}
              y={yMid + 4}
              textAnchor="middle"
              fontSize={11}
              className={cn(
                'font-medium',
                isActive ? 'fill-ink-1' : 'fill-ink-2',
              )}
            >
              {s.label}
            </text>
          </g>
        );
      })}
      <defs>
        <marker
          id="sca-arrow"
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
    </svg>
  );
}
