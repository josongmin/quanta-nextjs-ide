/**
 * Expandable route card.  Renders the three preview surfaces (Google SERP,
 * Facebook OG, Twitter) using the route's resolved metadata, then a list
 * of detected issues, JSON-LD validation, and the provenance section.
 */

import { useState } from 'react';
import { match } from 'ts-pattern';
import { Button, Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { RouteSeoReport, SeoSeverity } from './types';
import { aeoOpportunities } from './structured-data';
import { ProvenanceSection } from './provenance-section';

interface Props {
  readonly report: RouteSeoReport;
  readonly defaultOpen?: boolean;
}

const SEV_TONE: Record<SeoSeverity, 'err' | 'warn' | 'muted'> = {
  error: 'err',
  warn: 'warn',
  info: 'muted',
};

export function RouteCard({ report, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const m = report.metadata;
  const presentTypes = m.jsonLd.map((j) => j.type);
  const opps = aeoOpportunities(presentTypes);

  return (
    <div className="rounded-sm border border-line bg-bg-subtle/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-bg-hover/40"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ScoreDonut score={report.score} />
          <span className="truncate font-mono text-sm text-ink-1">
            {report.route}
          </span>
          {m.critical ? (
            <Chip tone="accent" size="xs">
              {m.critical}
            </Chip>
          ) : null}
          {m.dynamicFromCookies ? (
            <Chip tone="err" size="xs">
              cookie-bound
            </Chip>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-ink-3">
          <span>{report.issues.length} issues</span>
          <span>{open ? '▾' : '▸'}</span>
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-line p-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <SerpPreview
              title={m.title}
              description={m.description}
              url={m.canonical ?? `https://acme.example${report.route}`}
            />
            <OgPreview
              title={m.ogTitle ?? m.title}
              description={m.ogDescription ?? m.description}
              image={m.ogImage}
              url={m.canonical ?? `https://acme.example${report.route}`}
            />
            <TwitterPreview
              title={m.ogTitle ?? m.title}
              description={m.ogDescription ?? m.description}
              image={m.ogImage}
              card={m.twitterCard}
            />
          </div>

          <Subsection title={`Issues (${report.issues.length})`}>
            {report.issues.length === 0 ? (
              <div className="text-[11px] text-ink-3">All checks pass.</div>
            ) : (
              <ul className="space-y-1">
                {report.issues.map((i) => (
                  <li key={i.id} className="flex items-start gap-2 text-[11px]">
                    <Chip size="xs" tone={SEV_TONE[i.severity]}>
                      {i.severity}
                    </Chip>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-ink-1">{i.kind}</div>
                      <div className="text-ink-2">{i.suggestion}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Subsection>

          <Subsection title="Structured data (JSON-LD)">
            {m.jsonLd.length === 0 ? (
              <div className="text-[11px] text-ink-3">
                None detected.
                {opps.length > 0 ? (
                  <span className="ml-1 text-ink-2">
                    AEO opportunities: {opps.slice(0, 4).join(', ')}
                    {opps.length > 4 ? '…' : ''}
                  </span>
                ) : null}
              </div>
            ) : (
              <ul className="space-y-1">
                {m.jsonLd.map((j) => (
                  <li
                    key={`${j.type}-${j.source}`}
                    className="flex items-center gap-1.5 text-[11px]"
                  >
                    <Chip size="xs" tone={j.valid ? 'static' : 'warn'}>
                      {j.type}
                    </Chip>
                    <span className="font-mono text-ink-3">{j.source}</span>
                    {!j.valid ? (
                      <span className="text-sev-warn">
                        missing: {j.missingFields.join(', ')}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Subsection>

          <Subsection title="Provenance">
            <ProvenanceSection provenance={m.provenance} />
          </Subsection>

          <div className="flex items-center justify-end gap-1.5 pt-1">
            <Button size="xs" tone="ghost">
              Open page.tsx
            </Button>
            <Button size="xs" tone="soft">
              Copy metadata snippet
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Subsection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section>
      <div className="text-caps text-[10px] uppercase tracking-wider text-ink-3">
        {title}
      </div>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function ScoreDonut({ score }: { readonly score: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const tone = match(score)
    .when(
      (s) => s >= 80,
      () => 'stroke-sem-static',
    )
    .when(
      (s) => s >= 50,
      () => 'stroke-sev-warn',
    )
    .otherwise(() => 'stroke-sev-err');
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" className="shrink-0">
      <circle
        cx={10}
        cy={10}
        r={r}
        fill="none"
        className="stroke-line"
        strokeWidth={2}
      />
      <circle
        cx={10}
        cy={10}
        r={r}
        fill="none"
        className={tone}
        strokeWidth={2}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={c / 4}
        strokeLinecap="round"
      />
      <text
        x={10}
        y={12}
        textAnchor="middle"
        className="fill-ink-1 text-[8px] font-medium"
      >
        {score}
      </text>
    </svg>
  );
}

interface PreviewProps {
  readonly title: string | null;
  readonly description: string | null;
  readonly url?: string;
  readonly image?: string | null;
  readonly card?: 'summary' | 'summary_large_image' | null;
}

function SerpPreview({ title, description, url }: PreviewProps) {
  return (
    <PreviewFrame label="Google search result">
      <div className="space-y-1 p-2 text-[11px]">
        <div className="text-[10px] text-ink-3">{prettyUrl(url ?? '')}</div>
        <div className="line-clamp-1 font-medium text-accent">
          {title ?? <span className="text-sev-err">[missing title]</span>}
        </div>
        <div className="line-clamp-2 text-ink-2">
          {description ?? (
            <span className="text-sev-warn">[missing description]</span>
          )}
        </div>
      </div>
    </PreviewFrame>
  );
}

function OgPreview({ title, description, image, url }: PreviewProps) {
  return (
    <PreviewFrame label="Facebook / OG card">
      <div className="overflow-hidden">
        <div
          className={cn(
            'flex h-20 items-center justify-center text-[10px] text-ink-3',
            image ? 'bg-bg' : 'bg-bg-subtle',
          )}
        >
          {image ? (
            <span className="font-mono text-ink-2">{image}</span>
          ) : (
            <span className="text-sev-warn">[no og image]</span>
          )}
        </div>
        <div className="border-t border-line bg-bg-subtle/40 px-2 py-1.5 text-[10px]">
          <div className="text-[9px] uppercase tracking-wide text-ink-3">
            {prettyHost(url ?? '')}
          </div>
          <div className="line-clamp-1 font-medium text-ink-1">
            {title ?? '—'}
          </div>
          <div className="line-clamp-2 text-ink-2">{description ?? ''}</div>
        </div>
      </div>
    </PreviewFrame>
  );
}

function TwitterPreview({ title, description, image, card }: PreviewProps) {
  const isLarge = card === 'summary_large_image';
  return (
    <PreviewFrame label={`Twitter ${card ?? 'no card'}`}>
      <div
        className={cn(
          'overflow-hidden rounded-sm',
          isLarge ? 'flex flex-col' : 'flex',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center text-[10px] text-ink-3',
            image ? 'bg-bg' : 'bg-bg-subtle',
            isLarge ? 'h-16 w-full' : 'h-16 w-16',
          )}
        >
          {image ? (
            <span className="font-mono text-ink-2">img</span>
          ) : (
            <span className="text-sev-warn">none</span>
          )}
        </div>
        <div className="min-w-0 flex-1 border-t border-line bg-bg-subtle/40 p-1.5 text-[10px]">
          <div className="line-clamp-1 font-medium text-ink-1">
            {title ?? '—'}
          </div>
          <div className="line-clamp-2 text-ink-2">{description ?? ''}</div>
        </div>
      </div>
    </PreviewFrame>
  );
}

function PreviewFrame({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-line bg-bg">
      <div className="hairline-b px-2 py-1 text-[9px] uppercase tracking-wide text-ink-3">
        {label}
      </div>
      {children}
    </div>
  );
}

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return url;
  }
}
function prettyHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
