import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { MOCK_SCRIPTS, analyzeScript, type ScriptCategory } from './helpers';

const CATEGORIES: ReadonlyArray<{ id: 'all' | ScriptCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'payment', label: 'Payment' },
  { id: 'tag-manager', label: 'Tag manager' },
  { id: 'chat', label: 'Chat' },
  { id: 'misc', label: 'Misc' },
];

export function ScriptRiskOverlay() {
  const open = useUiStore((s) => s.overlays.scriptRisk.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [filter, setFilter] = useState<'all' | ScriptCategory>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? MOCK_SCRIPTS : MOCK_SCRIPTS.filter((s) => s.category === filter)),
    [filter],
  );

  const totalLcp = filtered.reduce((sum, s) => sum + s.lcpDelta, 0);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('scriptRisk'))}
      title="Third-Party Script Risk"
      subtitle={`${filtered.length} script${filtered.length === 1 ? '' : 's'} · ~${totalLcp}ms total LCP impact`}
      size="md"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Generate report (preview)')}>
            <Icon.Doc className="h-3 w-3" />
            Generate report
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              aria-selected={filter === c.id}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                filter === c.id && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-line/60">
        {filtered.map((s) => {
          const risks = analyzeScript(s);
          return (
            <li
              key={s.id}
              className="grid grid-cols-[1fr_auto_auto] items-start gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Chip tone="muted" size="xs">
                    {s.category}
                  </Chip>
                  <span className="truncate font-mono text-xs text-ink-1">{s.src}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-3">
                  <span className="font-mono">{s.file.split('/').slice(-2).join('/')}:{s.line}</span>
                  <span>·</span>
                  <Chip
                    tone={match(s.strategy)
                      .with('beforeInteractive', () => 'err' as const)
                      .with('afterInteractive', () => 'warn' as const)
                      .with('lazyOnload', () => 'static' as const)
                      .with('worker', () => 'info' as const)
                      .exhaustive()}
                    size="xs"
                  >
                    <span className="font-mono">{s.strategy}</span>
                  </Chip>
                  {s.consentRequired ? (
                    <Chip tone="warn" size="xs">
                      consent ✗
                    </Chip>
                  ) : (
                    <Chip tone="static" size="xs">
                      consent ✓
                    </Chip>
                  )}
                  <Chip tone={s.lcpDelta > 200 ? 'err' : s.lcpDelta > 80 ? 'warn' : 'static'} size="xs">
                    LCP +{s.lcpDelta}ms
                  </Chip>
                </div>
                {risks.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {risks.map((r) => (
                      <Chip key={r} tone="err" size="xs">
                        {r}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button size="xs" tone="ghost" onClick={() => toast(`View ${s.file}`)}>
                  View source
                </Button>
                <Button size="xs" tone="default" onClick={() => toast('Suggest fix (preview)')}>
                  Suggest fix
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hairline-t bg-bg-subtle px-3 py-2 text-[11px] text-ink-3">
        Aggregate LCP impact: <span className="font-mono text-ink-1">~{totalLcp}ms</span> across{' '}
        {filtered.length} script{filtered.length === 1 ? '' : 's'}.
      </div>
    </OverlayPanel>
  );
}
