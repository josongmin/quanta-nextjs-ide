/**
 * Provenance section.  Spec area 28-1 (data lineage surface).
 *
 * Shows where each metadata field came from — when title is "product.name"
 * sourced from prisma, we surface that chain so the developer can answer
 * "why is this title 'undefined' for crawlers?" without leaving the panel.
 *
 * This is co-located inside seo-metadata for now; if a generic tracer
 * lands later we can swap the local chain for the shared one.
 */

import { match } from 'ts-pattern';
import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { MetadataFieldProvenance } from './types';

interface Props {
  readonly provenance: ReadonlyArray<MetadataFieldProvenance>;
}

const ORIGIN_TONE = {
  static: 'static',
  db: 'accent',
  cms: 'info',
  env: 'muted',
  cookie: 'err',
  header: 'warn',
} as const;

const ORIGIN_LABEL: Record<MetadataFieldProvenance['origin'], string> = {
  static: 'static',
  db: 'database',
  cms: 'CMS',
  env: 'env var',
  cookie: 'cookie',
  header: 'header',
};

export function ProvenanceSection({ provenance }: Props) {
  if (provenance.length === 0) {
    return (
      <div className="text-[11px] text-ink-3">
        No dynamic fields — all metadata is statically declared.
      </div>
    );
  }
  return (
    <ul className="space-y-1.5">
      {provenance.map((p) => {
        const tone = ORIGIN_TONE[p.origin];
        const risky = p.origin === 'cookie' || p.origin === 'header';
        return (
          <li
            key={p.field}
            className={cn(
              'rounded-sm border bg-bg-subtle/40 p-2',
              risky ? 'border-sev-warn/50' : 'border-line',
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-ink-1">
                {p.field}
              </span>
              <Chip size="xs" tone={tone}>
                {ORIGIN_LABEL[p.origin]}
              </Chip>
              {risky ? (
                <Chip size="xs" tone="err">
                  crawler-risk
                </Chip>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-ink-2">
              {p.chain.map((step, i) => (
                <span key={`${p.field}-${i}`} className="inline-flex items-center">
                  <span
                    className={cn(
                      'rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono',
                      i === p.chain.length - 1 && 'text-accent',
                    )}
                  >
                    {step}
                  </span>
                  {i < p.chain.length - 1 ? (
                    <span className="px-1 text-ink-3">{originArrow(p.origin)}</span>
                  ) : null}
                </span>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function originArrow(origin: MetadataFieldProvenance['origin']): string {
  return match(origin)
    .with('db', () => '→')
    .with('cms', () => '→')
    .with('cookie', () => '⚠→')
    .with('header', () => '⚠→')
    .with('env', () => '·')
    .with('static', () => '·')
    .exhaustive();
}
