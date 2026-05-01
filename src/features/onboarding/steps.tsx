import type { ReactNode } from 'react';
import { Chip, Kbd } from '@shared/ui';

export interface OnboardingStep {
  id: string;
  title: string;
  body: ReactNode;
  illustration: ReactNode;
}

/* ── Light, hairline-only inline illustrations ─────────────────────────────── */

function MagnifierIllustration() {
  return (
    <svg
      viewBox="0 0 280 120"
      className="h-[140px] w-full text-ink-3"
      aria-hidden
    >
      <rect
        x="0.5"
        y="0.5"
        width="279"
        height="119"
        rx="6"
        ry="6"
        fill="white"
        stroke="currentColor"
        strokeOpacity="0.35"
      />
      {/* dot grid */}
      <g fill="currentColor" fillOpacity="0.25">
        {Array.from({ length: 7 }).map((_, ry) =>
          Array.from({ length: 16 }).map((__, rx) => (
            <circle key={`${rx}-${ry}`} cx={20 + rx * 16} cy={20 + ry * 14} r="1" />
          )),
        )}
      </g>
      {/* magnifier */}
      <g
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.85"
        strokeWidth="1.25"
      >
        <circle cx="180" cy="62" r="26" />
        <line x1="200" y1="82" x2="222" y2="104" strokeLinecap="round" />
      </g>
      {/* one highlighted dot inside the lens */}
      <circle cx="172" cy="58" r="2.4" fill="hsl(var(--accent))" />
    </svg>
  );
}

function AppMapIllustration() {
  const tabs = ['Routes', 'Actions', 'Handlers', 'Tags', 'Islands', 'Layouts', 'Meta', 'Env', 'Mid'];
  return (
    <svg
      viewBox="0 0 280 140"
      className="h-[140px] w-full text-ink-3"
      aria-hidden
    >
      <rect
        x="0.5"
        y="0.5"
        width="279"
        height="139"
        rx="6"
        ry="6"
        fill="white"
        stroke="currentColor"
        strokeOpacity="0.35"
      />
      <rect
        x="12"
        y="12"
        width="92"
        height="116"
        rx="3"
        fill="hsl(var(--bg-subtle))"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      {tabs.map((t, i) => (
        <g key={t}>
          <rect
            x="18"
            y={20 + i * 12}
            width="80"
            height="9"
            rx="1.5"
            fill={i === 0 ? 'hsl(var(--bg-selected))' : 'transparent'}
            stroke="none"
          />
          <text
            x="22"
            y={27 + i * 12}
            fontSize="7"
            fill="currentColor"
            fillOpacity={i === 0 ? 1 : 0.75}
          >
            {t}
          </text>
        </g>
      ))}
      <rect
        x="116"
        y="12"
        width="152"
        height="116"
        rx="3"
        fill="white"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <line x1="124" y1="36" x2="260" y2="36" stroke="currentColor" strokeOpacity="0.3" />
      <line x1="124" y1="56" x2="232" y2="56" stroke="currentColor" strokeOpacity="0.25" />
      <line x1="124" y1="76" x2="244" y2="76" stroke="currentColor" strokeOpacity="0.2" />
    </svg>
  );
}

function InspectorDiffIllustration() {
  return (
    <svg
      viewBox="0 0 280 140"
      className="h-[140px] w-full text-ink-3"
      aria-hidden
    >
      <rect
        x="0.5"
        y="0.5"
        width="279"
        height="139"
        rx="6"
        ry="6"
        fill="white"
        stroke="currentColor"
        strokeOpacity="0.35"
      />
      <rect
        x="12"
        y="12"
        width="160"
        height="80"
        rx="3"
        fill="hsl(var(--bg-subtle))"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <text x="20" y="26" fontSize="7" fill="currentColor">editor</text>
      <line x1="20" y1="36" x2="160" y2="36" stroke="currentColor" strokeOpacity="0.3" />
      <line x1="20" y1="48" x2="148" y2="48" stroke="currentColor" strokeOpacity="0.25" />
      <line x1="20" y1="60" x2="120" y2="60" stroke="currentColor" strokeOpacity="0.2" />

      <rect
        x="180"
        y="12"
        width="88"
        height="80"
        rx="3"
        fill="white"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <text x="186" y="26" fontSize="7" fill="currentColor">inspector</text>
      <line x1="186" y1="36" x2="262" y2="36" stroke="currentColor" strokeOpacity="0.3" />
      <line x1="186" y1="48" x2="248" y2="48" stroke="currentColor" strokeOpacity="0.25" />
      <line x1="186" y1="60" x2="252" y2="60" stroke="currentColor" strokeOpacity="0.25" />

      <rect
        x="12"
        y="100"
        width="256"
        height="28"
        rx="3"
        fill="white"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <text x="20" y="118" fontSize="7" fill="currentColor">semantic diff · /products  dynamic → ISR</text>
    </svg>
  );
}

function QualityBundleIllustration() {
  return (
    <svg
      viewBox="0 0 280 140"
      className="h-[140px] w-full text-ink-3"
      aria-hidden
    >
      <rect
        x="0.5"
        y="0.5"
        width="279"
        height="139"
        rx="6"
        ry="6"
        fill="white"
        stroke="currentColor"
        strokeOpacity="0.35"
      />
      {/* Quality */}
      <rect
        x="12"
        y="12"
        width="124"
        height="116"
        rx="3"
        fill="white"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <text x="20" y="26" fontSize="7" fill="currentColor">Quality</text>
      <circle cx="40" cy="62" r="22" fill="none" stroke="currentColor" strokeOpacity="0.3" />
      <circle
        cx="40"
        cy="62"
        r="22"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeOpacity="0.85"
        strokeDasharray="100 138"
        transform="rotate(-90 40 62)"
      />
      <text x="80" y="58" fontSize="7" fill="currentColor">a11y · perf</text>
      <text x="80" y="72" fontSize="7" fill="currentColor" fillOpacity="0.7">42 issues</text>

      {/* Bundle */}
      <rect
        x="144"
        y="12"
        width="124"
        height="116"
        rx="3"
        fill="white"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <text x="152" y="26" fontSize="7" fill="currentColor">Bundle</text>
      {[
        { y: 38, w: 92 },
        { y: 50, w: 70 },
        { y: 62, w: 56 },
        { y: 74, w: 38 },
        { y: 86, w: 28 },
        { y: 98, w: 18 },
      ].map((b, i) => (
        <g key={i}>
          <rect
            x="152"
            y={b.y}
            width={b.w}
            height="6"
            rx="1.5"
            fill="hsl(var(--accent))"
            fillOpacity={0.65 - i * 0.08}
          />
          <text x="152" y={b.y - 1} fontSize="5.5" fill="currentColor" fillOpacity="0.6">
            {`chunk-${i + 1}`}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ── Steps ──────────────────────────────────────────────────────────────────── */

export const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Next Static Studio',
    illustration: <MagnifierIllustration />,
    body: (
      <div className="space-y-2">
        <p className="text-md text-ink-1">
          A Next.js + frontend semantic IDE.{' '}
          <span className="text-ink-2">Detective, not judge.</span>
        </p>
        <p className="text-xs text-ink-3">
          Every diagnostic comes as a triple: inline lens, ghost annotation, and a
          hover Evidence Card — with confidence, severity, and trace.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>P</Kbd>
            <span>Search · Commands</span>
          </span>
          <span className="text-ink-3/60">·</span>
          <span className="inline-flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>?</Kbd>
            <span>Keyboard help</span>
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'app-map',
    title: 'App Map (left panel)',
    illustration: <AppMapIllustration />,
    body: (
      <div className="space-y-2">
        <p className="text-md text-ink-1">9 lenses on your app, one click away.</p>
        <p className="text-xs text-ink-3">
          Routes · Actions · Handlers · Tags · Islands · Layouts · Meta · Env · Middleware.
          Toggle the panel with <Kbd>⌘</Kbd> <Kbd>B</Kbd>. The Quality lens lives at the
          bottom of the same column.
        </p>
        <div className="flex flex-wrap gap-1 pt-1">
          {['Routes', 'Actions', 'Handlers', 'Tags', 'Islands', 'Layouts', 'Meta', 'Env', 'Mid'].map(
            (t) => (
              <Chip key={t} tone="neutral" size="xs">
                {t}
              </Chip>
            ),
          )}
        </div>
      </div>
    ),
  },
  {
    id: 'inspector-diff',
    title: 'Inspector & Semantic Diff',
    illustration: <InspectorDiffIllustration />,
    body: (
      <div className="space-y-2">
        <p className="text-md text-ink-1">
          The right Inspector follows your cursor. Pin it to keep context.
        </p>
        <p className="text-xs text-ink-3">
          The bottom panel hosts Problems, Routes, Cache Lineage, and{' '}
          <span className="text-ink-2">Semantic Diff</span> — a behavior-level changelog of
          your edits. Open it with <Kbd>⌘</Kbd> <Kbd>⇧</Kbd> <Kbd>D</Kbd>.
        </p>
      </div>
    ),
  },
  {
    id: 'quality-bundle',
    title: 'Quality & Bundle',
    illustration: <QualityBundleIllustration />,
    body: (
      <div className="space-y-2">
        <p className="text-md text-ink-1">
          New tabs for app-level health.
        </p>
        <p className="text-xs text-ink-3">
          <span className="text-ink-2">Quality</span> rolls up a11y, performance, and
          unused-symbol diagnostics across the project.{' '}
          <span className="text-ink-2">Bundle</span> shows chunk costs, the client
          boundary, and what an extracted island would save.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-ink-3">
          <Chip tone="accent" size="xs">Quality</Chip>
          <Chip tone="info" size="xs">Bundle</Chip>
          <span>You can come back here any time from Settings.</span>
        </div>
      </div>
    ),
  },
];
