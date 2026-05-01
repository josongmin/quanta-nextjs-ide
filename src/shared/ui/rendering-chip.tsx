import type { Confidence, RenderingClass } from '@shared/types';
import { Chip } from './chip';
import { ConfidenceDot } from './confidence-dot';
import { Tooltip } from './tooltip';

interface Props {
  rendering: RenderingClass;
  confidence?: Confidence;
  showQuestion?: boolean;
}

const labels: Record<RenderingClass, string> = {
  static: 'STATIC',
  isr: 'ISR',
  dynamic: 'DYNAMIC',
  unknown: 'UNKNOWN',
};

const tones = {
  static: 'static',
  isr: 'isr',
  dynamic: 'dynamic',
  unknown: 'muted',
} as const;

const HELP: Record<RenderingClass, { full: string; what: string; example: string }> = {
  static: {
    full: 'Static — pre-rendered at build',
    what: 'Built once, served from CDN. Never re-renders unless you redeploy.',
    example: 'Marketing pages, /about, /pricing',
  },
  isr: {
    full: 'ISR — Incremental Static Regeneration',
    what: 'Pre-rendered, then refreshed on a revalidate timer or via revalidateTag/Path. Keeps CDN benefits + freshness.',
    example: '/products (revalidate 60), /blog/[slug]',
  },
  dynamic: {
    full: 'Dynamic — server-rendered per request',
    what: 'Built fresh on every request. Required when the page reads cookies(), headers(), searchParams, or non-cached fetch.',
    example: '/account, /checkout, /dashboard',
  },
  unknown: {
    full: 'Unknown',
    what: 'Static analysis could not classify this route.',
    example: 'Add explicit segment config or open the route inspector for evidence.',
  },
};

const CONF_HELP: Record<Confidence, string> = {
  high: 'High confidence — direct, structural evidence',
  medium: 'Medium confidence — indirect (helper-call) evidence',
  low: 'Low confidence — heuristic only',
};

export function RenderingChip({ rendering, confidence, showQuestion }: Props) {
  const help = HELP[rendering];
  return (
    <Tooltip
      content={
        <div className="max-w-[280px] space-y-1.5 p-1">
          <div className="text-xs font-medium text-ink-1">{help.full}</div>
          <div className="text-xs text-ink-2">{help.what}</div>
          <div className="text-[11px] text-ink-3">e.g. {help.example}</div>
          {confidence ? (
            <div className="mt-1.5 flex items-center gap-1.5 hairline-t pt-1.5 text-[11px] text-ink-3">
              <ConfidenceDot confidence={confidence} />
              <span>{CONF_HELP[confidence]}</span>
            </div>
          ) : null}
        </div>
      }
      side="top"
    >
      <Chip tone={tones[rendering]} size="sm" className="gap-1">
        {confidence ? <ConfidenceDot confidence={confidence} /> : null}
        <span>{labels[rendering]}</span>
        {showQuestion && confidence !== 'high' ? (
          <span className="text-ink-3" aria-hidden>
            ?
          </span>
        ) : null}
      </Chip>
    </Tooltip>
  );
}
