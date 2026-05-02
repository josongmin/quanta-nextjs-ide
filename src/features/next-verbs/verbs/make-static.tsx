/**
 * Verb 1 — "Make this route static".
 *
 * Reads resolveMode for the current route, lists every dynamic trigger,
 * and proposes a fix per trigger. Final pill shows the projected mode
 * after applying all unchecked triggers.
 */

import { useState } from 'react';
import { Icon } from '@shared/ui';
import { findMode, modeLabel } from '@features/render-mode-badge/resolver';
import type { ModeSignal, RenderMode } from '@features/render-mode-badge/types';
import { showVerbPreview } from '../preview-shell';
import type { NextVerb } from '../types';

const FIX_BY_KIND: Record<ModeSignal['kind'], string> = {
  cookies: 'Move cookies() into a server action; pass derived value as prop.',
  headers: 'Read headers() in a route handler instead.',
  searchParams: 'Read searchParams from page props (still works in static).',
  noStore: 'Wrap data fetch in `cache()` or remove `no-store`.',
  'fetch-no-store': 'Remove `cache: "no-store"`; use `next: { revalidate: N }`.',
  'fetch-cache': 'Switch to `force-cache` if data is genuinely static.',
  revalidate: 'Drop `revalidate` if data is fully static.',
  'force-dynamic': 'Remove `export const dynamic = "force-dynamic"`.',
  'force-static': 'Already static — no action.',
  suspense: 'No action — streaming is compatible with static.',
  'use-client': 'Lift state up; keep page server-only.',
};

function MakeStaticBody({ routePath }: { routePath: string }) {
  const resolved = findMode(routePath);
  const [unchecked, setUnchecked] = useState<Set<number>>(new Set());

  if (!resolved) {
    return (
      <div className="text-ink-3">
        No render-mode info for <span className="font-mono">{routePath}</span>.
      </div>
    );
  }

  const projected: RenderMode =
    resolved.signals.every((_, i) => unchecked.has(i)) ? 'static' : resolved.mode;

  return (
    <div className="space-y-3">
      <div className="text-ink-2">
        <span className="font-mono text-ink-1">{routePath}</span> currently
        resolves to{' '}
        <span className="font-medium text-accent">{modeLabel(resolved.mode)}</span>.
      </div>
      {resolved.signals.length === 0 ? (
        <div className="rounded-sm border border-line bg-bg-subtle p-2 text-2xs text-ink-3">
          No dynamic triggers detected. Already static-eligible.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {resolved.signals.map((s, i) => {
            const isUnchecked = unchecked.has(i);
            return (
              <li
                key={`${s.file}:${s.line}:${i}`}
                className="flex items-start gap-2 rounded-sm border border-line/60 bg-bg-subtle p-2"
              >
                <input
                  type="checkbox"
                  checked={!isUnchecked}
                  onChange={() => {
                    setUnchecked((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    });
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon.Zap className="h-3 w-3 text-sev-warn" />
                    <span className="font-mono text-2xs text-ink-1">{s.kind}</span>
                    <span className="text-2xs text-ink-3">
                      {s.file}:{s.line}
                    </span>
                  </div>
                  <div className="mt-0.5 text-2xs text-ink-3">
                    {FIX_BY_KIND[s.kind]}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-center justify-between rounded-sm border border-accent/30 bg-accent/5 px-2 py-1.5">
        <span className="text-2xs uppercase tracking-wider text-ink-3">
          Projected
        </span>
        <span className="font-medium text-accent">{modeLabel(projected)}</span>
      </div>
    </div>
  );
}

export const makeStaticVerb: NextVerb = {
  id: 'make-static',
  title: 'Make this route static',
  description: 'List dynamic triggers and propose fixes for the current route.',
  hotkey: ['⌘', '⇧', 'S'],
  category: 'mode',
  icon: Icon.Zap,
  shouldShow: (ctx) => Boolean(ctx.routePath),
  run: (ctx) => {
    if (!ctx.routePath) return;
    const path = ctx.routePath;
    showVerbPreview({
      verbId: 'make-static',
      title: `Make ${path} static`,
      body: <MakeStaticBody routePath={path} />,
      primaryLabel: 'Apply (preview)',
      secondaryLabel: 'Cancel',
      onPrimary: () => {
        // TODO: wire to a real route-config patcher; for now the preview is read-only.
      },
    });
  },
};
