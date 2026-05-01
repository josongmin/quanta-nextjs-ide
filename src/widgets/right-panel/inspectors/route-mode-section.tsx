/**
 * RouteModeSection — embeds the resolved render-mode card inside the
 * route-contract inspector.  This component is the thin glue between the
 * `useRouteStore` (which knows the route id) and the
 * `useRenderModeStore` (which holds resolved modes).
 *
 * It is intentionally additive — it does not modify any existing inspector
 * fields, only contributes a new collapsible section.
 */

import { useMemo } from 'react';
import { Section, Chip, Button } from '@shared/ui';
import { useRouteStore } from '@entities/route';
import { useRenderModeStore } from '@features/render-mode-badge/store';
import { RenderModeBadge } from '@features/render-mode-badge/badge';
import { WhyCard } from '@features/render-mode-badge/why-card';
import { resolveMode } from '@features/render-mode-badge/resolver';
import type { ModeSignal } from '@features/render-mode-badge/types';

interface Props {
  readonly routeId: string;
}

/**
 * Synthesize signals from the route-store record so we can compute a
 * mode even before the deeper indexer feeds real ones in.  This keeps
 * the surface useful in mock workspaces.
 */
function synthesizeSignals(routePath: string): ModeSignal[] {
  const sigs: ModeSignal[] = [];
  if (/\[.*\]/.test(routePath)) {
    sigs.push({
      kind: 'cookies',
      file: `app${routePath}/page.tsx`,
      line: 12,
      snippet: 'const c = cookies()',
      effect: 'Forces dynamic rendering',
    });
  }
  if (routePath.startsWith('/blog')) {
    sigs.push({
      kind: 'revalidate',
      file: `app${routePath}/page.tsx`,
      line: 4,
      snippet: 'export const revalidate = 60',
      effect: 'ISR window of 60s',
    });
  }
  return sigs;
}

export function RouteModeSection({ routeId }: Props) {
  const route = useRouteStore((s) => s.byId(routeId));
  const cached = useRenderModeStore((s) =>
    route ? s.resolved[route.path] : undefined,
  );

  const resolved = useMemo(() => {
    if (cached) return cached;
    if (!route) return null;
    return resolveMode({
      route: route.path,
      signals: synthesizeSignals(route.path),
    });
  }, [cached, route]);

  if (!route || !resolved) return null;

  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          <span>Resolved render mode</span>
          <RenderModeBadge resolved={resolved} compact />
        </span>
      }
      defaultOpen
    >
      <div className="space-y-2">
        <div className="grid grid-cols-[100px_1fr] gap-y-1 text-[11px]">
          <span className="text-ink-3">Route</span>
          <span className="font-mono text-ink-1">{resolved.route}</span>
          <span className="text-ink-3">Mode</span>
          <span className="font-mono text-ink-1">{resolved.mode}</span>
          <span className="text-ink-3">Cause</span>
          <span className="text-ink-2">{resolved.cause}</span>
          {resolved.overrides.length > 0 ? (
            <>
              <span className="text-ink-3">Overrides</span>
              <span className="flex flex-wrap gap-1">
                {resolved.overrides.map((o) => (
                  <Chip key={o} size="xs" tone="warn">
                    {o}
                  </Chip>
                ))}
              </span>
            </>
          ) : null}
          <span className="text-ink-3">Final</span>
          <span className="text-ink-1">{resolved.behavior}</span>
        </div>

        <WhyCard resolved={resolved} />

        <div className="flex items-center justify-end gap-1">
          <Button size="xs" tone="ghost">
            Open route segment
          </Button>
          <Button size="xs" tone="soft">
            Run what-if
          </Button>
        </div>
      </div>
    </Section>
  );
}
