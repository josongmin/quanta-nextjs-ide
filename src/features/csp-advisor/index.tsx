import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel, SeverityDot } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  CSP_SOURCES,
  INLINE_SCRIPTS,
  generateCspHeader,
  type CspProfile,
  type CspSource,
} from './helpers';

const PROFILES: ReadonlyArray<{ id: CspProfile; label: string }> = [
  { id: 'strict', label: 'Strict' },
  { id: 'standard', label: 'Standard' },
  { id: 'loose', label: 'Loose' },
];

const DIRECTIVES: ReadonlyArray<CspSource['directive']> = [
  'img-src',
  'script-src',
  'connect-src',
  'style-src',
  'font-src',
  'frame-src',
];

export function CspAdvisorOverlay() {
  const open = useUiStore((s) => s.overlays.cspAdvisor.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [profile, setProfile] = useState<CspProfile>('standard');
  const header = useMemo(() => generateCspHeader(CSP_SOURCES, profile), [profile]);

  const grouped = useMemo(() => {
    const m = new Map<CspSource['directive'], CspSource[]>();
    for (const d of DIRECTIVES) m.set(d, []);
    for (const s of CSP_SOURCES) {
      const arr = m.get(s.directive) ?? [];
      arr.push(s);
      m.set(s.directive, arr);
    }
    return m;
  }, []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('cspAdvisor'))}
      title="CSP Advisor"
      subtitle={`${CSP_SOURCES.length} sources · ${INLINE_SCRIPTS.length} inline script${INLINE_SCRIPTS.length === 1 ? '' : 's'}`}
      size="md"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Audit again (mock)')}>
            Audit again
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Apply to next.config (preview)')}>
            <Icon.Settings className="h-3 w-3" />
            Apply to next.config
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() => {
              navigator.clipboard
                ?.writeText(header)
                .then(() => toast('CSP header copied'))
                .catch(() => toast('Clipboard unavailable'));
            }}
          >
            <Icon.Doc className="h-3 w-3" />
            Copy header
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-caps text-ink-3">Profile</span>
        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {PROFILES.map((p) => (
            <button
              key={p.id}
              onClick={() => setProfile(p.id)}
              aria-selected={profile === p.id}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                profile === p.id && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Detected sources */}
      <section className="hairline-b">
        <div className="px-3 py-2 text-caps text-ink-3 hairline-b">Detected external sources</div>
        {DIRECTIVES.map((d) => {
          const arr = grouped.get(d) ?? [];
          if (arr.length === 0) return null;
          return (
            <div key={d} className="hairline-b">
              <div className="flex h-7 items-center gap-2 bg-bg-subtle px-3 text-[10px] uppercase tracking-caps text-ink-3">
                <Chip tone="muted" size="xs">
                  <span className="font-mono">{d}</span>
                </Chip>
                <span>{arr.length}</span>
              </div>
              <ul className="divide-y divide-line/60">
                {arr.map((s, i) => (
                  <li
                    key={`${s.source}-${i}`}
                    className="grid grid-cols-[14px_1fr_auto_auto] items-center gap-2 px-3 py-1 text-xs"
                  >
                    <SeverityDot
                      severity={s.risk === 'risky' ? 'err' : s.risk === 'review' ? 'warn' : 'info'}
                    />
                    <span className="font-mono text-ink-1">{s.source}</span>
                    {s.file ? (
                      <span className="font-mono text-[10px] text-ink-3">
                        {s.file.split('/').slice(-2).join('/')}:{s.line}
                      </span>
                    ) : (
                      <span />
                    )}
                    <Chip
                      tone={s.risk === 'risky' ? 'err' : s.risk === 'review' ? 'warn' : 'static'}
                      size="xs"
                    >
                      {s.risk}
                    </Chip>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* Inline scripts */}
      {INLINE_SCRIPTS.length > 0 && (
        <section className="hairline-b px-3 py-3">
          <div className="text-caps text-ink-3">Inline scripts</div>
          {INLINE_SCRIPTS.map((s, i) => (
            <div key={i} className="mt-2 grid grid-cols-[1fr_auto] items-start gap-2 text-xs">
              <div>
                <div className="font-mono text-ink-1">{s.file}:{s.line}</div>
                <div className="font-mono text-[11px] text-ink-3">{s.hash}</div>
                <div className="text-ink-3">{s.suggestion}</div>
              </div>
              <Button size="xs" tone="ghost" onClick={() => toast('Add to script-src (preview)')}>
                Add to script-src
              </Button>
            </div>
          ))}
        </section>
      )}

      {/* Generated header */}
      <section className="px-3 py-3">
        <div className="text-caps text-ink-3">Generated header</div>
        <pre className="mt-2 overflow-x-auto rounded-sm border border-line bg-bg-subtle p-3 font-mono text-[11px] leading-relaxed text-ink-1">
          <code>Content-Security-Policy: {header}</code>
        </pre>
      </section>
    </OverlayPanel>
  );
}
