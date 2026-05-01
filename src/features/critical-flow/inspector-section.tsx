/**
 * Embed-in-route-inspector section.
 *
 * Given a route id, surfaces the critical flows it belongs to with a
 * concise badge + label. Returns null when the route is not part of any
 * critical flow so it can be safely mounted in the route inspector.
 */

import { useMemo } from 'react';
import { CreditCard, KeyRound, ShieldCheck, ShoppingCart, Receipt, UserCog } from 'lucide-react';
import { Chip } from '@shared/ui';
import { useCriticalFlowStore } from './store';
import type { CriticalFlowKind } from './types';
import { flowsForRoute } from './detector';

const KIND_ICON = {
  payment: CreditCard,
  auth: KeyRound,
  admin: UserCog,
  billing: Receipt,
  order: ShoppingCart,
  pii: ShieldCheck,
} as const satisfies Record<CriticalFlowKind, typeof CreditCard>;

interface Props {
  routeId: string;
}

export function CriticalFlowInspectorSection({ routeId }: Props): JSX.Element | null {
  const detected = useCriticalFlowStore((s) => s.detected);
  const manual = useCriticalFlowStore((s) => s.manual);
  const strictOverrides = useCriticalFlowStore((s) => s.strictOverrides);

  const matches = useMemo(() => {
    const detMatches = flowsForRoute(detected, routeId);
    const manMatches = manual
      .filter((t) => t.routes.includes(routeId))
      .map((t) => ({
        id: t.id,
        kind: t.kind,
        label: t.label ?? `${t.kind} (manual)`,
        strict: strictOverrides[t.id] ?? t.strict ?? false,
        manual: true,
      }));
    return [
      ...detMatches.map((m) => ({
        id: m.id,
        kind: m.kind,
        label: m.label,
        strict: strictOverrides[m.id] ?? m.strict ?? false,
        manual: false,
      })),
      ...manMatches,
    ];
  }, [detected, manual, strictOverrides, routeId]);

  if (matches.length === 0) return null;

  return (
    <div
      className="rounded-md border border-sev-warn/30 bg-sev-warn-soft/30 px-3 py-2"
      data-testid="critical-flow-inspector"
    >
      <div className="text-[10px] font-medium uppercase tracking-caps text-sev-warn">
        Critical flow
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {matches.map((m) => {
          const Icon = KIND_ICON[m.kind];
          return (
            <Chip
              key={m.id}
              tone={m.strict ? 'err' : 'warn'}
              size="sm"
              className="gap-1"
            >
              <Icon className="h-3 w-3" />
              {m.label}
              {m.strict ? <span className="ml-1 text-[9px]">strict</span> : null}
              {m.manual ? <span className="ml-1 text-[9px] opacity-70">tag</span> : null}
            </Chip>
          );
        })}
      </div>
      <div className="mt-1 text-[11px] text-ink-3">
        Changes touching this route accrue extra proof obligations.
      </div>
    </div>
  );
}
