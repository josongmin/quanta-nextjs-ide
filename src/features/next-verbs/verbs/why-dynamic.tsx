/**
 * Verb 2 — "Why is this page dynamic?".
 *
 * Renders a vertical reasoning chain using ResolvedMode signals.
 * Each step shows file:line and the dominant cause; final pill is the
 * resolved mode.
 */

import { useEditorStore } from '@entities/editor';
import { Icon } from '@shared/ui';
import { findMode, modeLabel } from '@features/render-mode-badge/resolver';
import { showVerbPreview } from '../preview-shell';
import type { NextVerb } from '../types';

function WhyDynamicBody({ routePath }: { routePath: string }) {
  const resolved = findMode(routePath);
  const openTab = useEditorStore((s) => s.openTab);

  if (!resolved) {
    return (
      <div className="text-ink-3">
        No render-mode info for <span className="font-mono">{routePath}</span>.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-ink-2">
        Reasoning chain for{' '}
        <span className="font-mono text-ink-1">{routePath}</span>
      </div>
      <ol className="relative space-y-2 border-l border-line/60 pl-4">
        {resolved.signals.length === 0 ? (
          <li className="text-2xs text-ink-3">
            No signals — defaulted to static.
          </li>
        ) : (
          resolved.signals.map((s, i) => (
            <li key={`${s.file}:${s.line}:${i}`} className="relative">
              <span className="absolute -left-[18px] top-1 h-2 w-2 rounded-full bg-accent" />
              <button
                type="button"
                onClick={() =>
                  openTab({
                    id: `verb-${s.file}`,
                    file: s.file,
                    label: s.file.split('/').pop() ?? s.file,
                  })
                }
                className="block w-full rounded-sm border border-line/60 bg-bg-subtle p-2 text-left hover:border-line-strong"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-2xs text-ink-1">{s.kind}</span>
                  <span className="text-2xs text-ink-3">
                    {s.file}:{s.line}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-2xs text-ink-2 truncate">
                  {s.snippet}
                </div>
                <div className="mt-0.5 text-2xs text-ink-3">{s.effect}</div>
              </button>
            </li>
          ))
        )}
      </ol>
      <div className="flex items-center justify-between rounded-sm border border-accent/30 bg-accent/5 px-2 py-1.5">
        <span className="text-2xs uppercase tracking-wider text-ink-3">
          Final mode
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-accent">
          <Icon.Zap className="h-3 w-3" />
          {modeLabel(resolved.mode)}
        </span>
      </div>
      <div className="text-2xs text-ink-3 italic">{resolved.cause}</div>
    </div>
  );
}

export const whyDynamicVerb: NextVerb = {
  id: 'why-dynamic',
  title: 'Why is this page dynamic?',
  description: 'Show the reasoning chain that produced the current render mode.',
  hotkey: ['⌘', '⇧', 'W'],
  category: 'mode',
  icon: Icon.Bulb,
  shouldShow: (ctx) => Boolean(ctx.routePath),
  run: (ctx) => {
    if (!ctx.routePath) return;
    const path = ctx.routePath;
    showVerbPreview({
      verbId: 'why-dynamic',
      title: `Why is ${path} dynamic?`,
      body: <WhyDynamicBody routePath={path} />,
      primaryLabel: 'Open Evidence Tracer',
      onPrimary: () => {
        // Caller closes via Esc; we only show the chain inline.
      },
    });
  },
};
