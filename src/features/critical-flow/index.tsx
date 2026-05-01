/**
 * Critical Flow inspector — list every detected (or manually tagged)
 * critical flow with severity badge, route/action counts, and a
 * "make strict" toggle.
 *
 * Renders standalone (the parent surface decides where to mount it).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CreditCard,
  KeyRound,
  ShieldCheck,
  ShoppingCart,
  Receipt,
  UserCog,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useRouteStore } from '@entities/route';
import { useActionStore } from '@entities/server-action';
import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { detectCriticalFlows } from './detector';
import { useCriticalFlowStore } from './store';
import type { CriticalFlow, CriticalFlowKind } from './types';

const KIND_ICON: Record<CriticalFlowKind, typeof CreditCard> = {
  payment: CreditCard,
  auth: KeyRound,
  admin: UserCog,
  billing: Receipt,
  order: ShoppingCart,
  pii: ShieldCheck,
};

function severityTone(s: CriticalFlow['severity']): 'err' | 'warn' | 'info' | 'muted' {
  switch (s) {
    case 'critical':
      return 'err';
    case 'high':
      return 'warn';
    case 'medium':
      return 'info';
    case 'low':
      return 'muted';
  }
}

function FlowRow({ flow }: { flow: CriticalFlow }) {
  const [open, setOpen] = useState(false);
  const Icon = KIND_ICON[flow.kind];
  const toggleStrict = useCriticalFlowStore((s) => s.toggleStrict);
  const tone = severityTone(flow.severity);

  return (
    <div className="hairline-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-bg-subtle/60"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-ink-3" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-ink-3" />
        )}
        <Chip tone={tone} size="xs" className="uppercase">
          {flow.severity}
        </Chip>
        <Icon className="h-3.5 w-3.5 text-ink-2" />
        <span className="text-sm font-medium text-ink-1">{flow.label}</span>
        {flow.manual ? (
          <Chip tone="muted" size="xs">
            manual
          </Chip>
        ) : null}
        <span className="ml-auto flex items-center gap-1 text-[11px] text-ink-3">
          <span>{flow.routes.length} routes</span>
          <span>·</span>
          <span>{flow.actions.length} actions</span>
          <span>·</span>
          <span>conf {(flow.confidence * 100).toFixed(0)}%</span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleStrict(flow.id);
          }}
          className={cn(
            'ml-2 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-caps',
            flow.strict
              ? 'border-transparent bg-sev-err-soft text-sev-err'
              : 'border-line/70 bg-bg text-ink-3 hover:text-ink-1',
          )}
          aria-pressed={flow.strict ?? false}
        >
          {flow.strict ? 'strict on' : 'make strict'}
        </button>
      </button>
      {open ? (
        <div className="bg-bg-subtle/40 px-3 py-2 text-[11px] text-ink-3">
          <div className="font-medium text-ink-2">Routes</div>
          {flow.routes.length === 0 ? (
            <div className="italic text-ink-3">none</div>
          ) : (
            <ul className="ml-2 list-disc">
              {flow.routes.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <div className="mt-1 font-medium text-ink-2">Actions</div>
          {flow.actions.length === 0 ? (
            <div className="italic text-ink-3">none</div>
          ) : (
            <ul className="ml-2 list-disc">
              {flow.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <div className="mt-1 font-medium text-ink-2">Signals</div>
          <ul className="ml-2 list-disc">
            {flow.signals.slice(0, 6).map((s, i) => (
              <li key={`${s.source}-${i}`}>
                <code className="text-[10px]">{s.matched}</code> from{' '}
                <span className="text-ink-2">{s.source}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function CriticalFlowList(): JSX.Element {
  const routes = useRouteStore((s) => s.routes);
  const actions = useActionStore((s) => s.actions);
  const setDetected = useCriticalFlowStore((s) => s.setDetected);
  // Read the merged list reactively by deriving from store state.
  const detected = useCriticalFlowStore((s) => s.detected);
  const manual = useCriticalFlowStore((s) => s.manual);
  const strictOverrides = useCriticalFlowStore((s) => s.strictOverrides);

  useEffect(() => {
    setDetected(detectCriticalFlows(routes, actions));
  }, [routes, actions, setDetected]);

  const all = useMemo(() => {
    const merged = new Map<string, CriticalFlow>();
    for (const f of detected) {
      merged.set(f.id, { ...f, strict: strictOverrides[f.id] ?? false });
    }
    for (const t of manual) {
      merged.set(t.id, {
        id: t.id,
        kind: t.kind,
        label: t.label ?? `${t.kind} (manual)`,
        routes: t.routes,
        actions: t.actions,
        confidence: 1,
        severity: t.kind === 'payment' || t.kind === 'auth' ? 'high' : 'medium',
        signals: [{ source: 'user', matched: 'manual-tag', weight: 1 }],
        manual: true,
        strict: strictOverrides[t.id] ?? t.strict ?? false,
      });
    }
    return [...merged.values()];
  }, [detected, manual, strictOverrides]);

  if (all.length === 0) {
    return (
      <div className="rounded-lg border border-line/60 bg-bg/40 p-4 text-sm text-ink-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-ink-3" />
          <span>No critical flows detected.</span>
        </div>
        <div className="mt-1 text-[11px]">
          The detector looks for payment, auth, admin, billing, order and PII
          patterns in routes and server actions.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line/70 bg-bg/40 backdrop-blur">
      <div className="hairline-b bg-gradient-to-r from-bg-subtle/40 to-transparent px-3 py-2 text-xs uppercase tracking-caps text-ink-3">
        Critical Flows
      </div>
      <div className="flex flex-col">
        {all.map((flow) => (
          <FlowRow key={flow.id} flow={flow} />
        ))}
      </div>
    </div>
  );
}

export default CriticalFlowList;
