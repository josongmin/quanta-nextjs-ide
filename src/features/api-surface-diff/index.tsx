import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  KIND_TONE,
  SEVERITY_TONE,
  TABS,
  V1_SURFACE,
  V2_SURFACE,
  buildChangelog,
  diffSurfaces,
  semverVerdict,
  type DiffChange,
  type DiffTab,
} from './helpers';

const SOURCE_VERSIONS = ['v1.0.0', 'v0.9.0', 'v0.8.0'] as const;
const TARGET_VERSIONS = ['HEAD', 'v1.1.0-rc.1'] as const;

export function ApiSurfaceDiffOverlay() {
  const open = useUiStore((s) => s.overlays.apiSurfaceDiff.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [source, setSource] = useState<(typeof SOURCE_VERSIONS)[number]>(SOURCE_VERSIONS[0]);
  const [target, setTarget] = useState<(typeof TARGET_VERSIONS)[number]>(TARGET_VERSIONS[0]);
  const [tab, setTab] = useState<DiffTab>('changed');

  const diff = useMemo(() => diffSurfaces(V1_SURFACE, V2_SURFACE), []);
  const verdict = useMemo(() => semverVerdict(diff), [diff]);
  const changelog = useMemo(() => buildChangelog(diff), [diff]);

  const all: ReadonlyArray<DiffChange> = useMemo(
    () => [...diff.added, ...diff.removed, ...diff.changed, ...diff.deprecated],
    [diff],
  );

  const rows: ReadonlyArray<DiffChange> = useMemo(() => {
    if (tab === 'all') return all;
    if (tab === 'added') return diff.added;
    if (tab === 'removed') return diff.removed;
    if (tab === 'changed') return diff.changed;
    return diff.deprecated;
  }, [tab, all, diff]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('apiSurfaceDiff')}
      title="API Surface Diff"
      subtitle="Public surface comparison between versions"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            <span className="text-ink-2">{all.length}</span> total surface changes
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="default" onClick={() => toast('Changelog generated (mock)')}>
              Generate changelog
            </Button>
            <Button size="xs" tone="accent" onClick={() => toast.success('Release PR drafted (mock)')}>
              Open release PR (mock)
            </Button>
          </div>
        </div>
      }
    >
      {/* Version pickers */}
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">source</span>
        {SOURCE_VERSIONS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setSource(v)}
            className={cn(
              'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
              source === v
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {v}
          </button>
        ))}
        <span className="mx-1 text-ink-3">→</span>
        <span className="text-[10px] uppercase tracking-caps text-ink-3">target</span>
        {TARGET_VERSIONS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setTarget(v)}
            className={cn(
              'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
              target === v
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <main className="min-w-0 px-3 py-3">
          {/* Tabs */}
          <div className="mb-2 flex items-center gap-1.5 text-[11px]">
            {TABS.map((t) => {
              const count =
                t.key === 'all'
                  ? all.length
                  : t.key === 'added'
                    ? diff.added.length
                    : t.key === 'removed'
                      ? diff.removed.length
                      : t.key === 'changed'
                        ? diff.changed.length
                        : diff.deprecated.length;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex h-6 items-center gap-1 rounded-sm border px-1.5 font-mono',
                    tab === t.key
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                  )}
                >
                  <span>{t.label}</span>
                  <span className="text-ink-3">{count}</span>
                </button>
              );
            })}
          </div>

          {rows.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-ink-3">No items in this tab.</div>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={`${r.type}-${r.id}`} className="rounded-sm border border-line bg-bg p-2">
                  <div className="flex items-center gap-2">
                    <Chip tone={KIND_TONE[r.kind]} size="xs">
                      {r.kind}
                    </Chip>
                    <span className="font-mono text-[12px] text-ink-1">{r.name}</span>
                    <Chip tone={SEVERITY_TONE[r.severity]} size="xs">
                      {r.severity}
                    </Chip>
                    <Chip
                      tone={
                        r.type === 'added'
                          ? 'static'
                          : r.type === 'removed'
                            ? 'err'
                            : r.type === 'changed'
                              ? 'warn'
                              : 'info'
                      }
                      size="xs"
                    >
                      {r.type}
                    </Chip>
                  </div>
                  <div className="mt-1.5">
                    {r.type === 'changed' && r.before !== undefined && r.after !== undefined ? (
                      <div className="grid grid-cols-2 gap-2">
                        <CodeBlock
                          code={r.before.signature}
                          language="ts"
                          diff="before"
                          showLineNumbers={false}
                          maxHeight={80}
                        />
                        <CodeBlock
                          code={r.after.signature}
                          language="ts"
                          diff="after"
                          showLineNumbers={false}
                          maxHeight={80}
                        />
                      </div>
                    ) : (
                      <CodeBlock
                        code={(r.after ?? r.before)?.signature ?? ''}
                        language="ts"
                        showLineNumbers={false}
                        maxHeight={80}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>

        <aside className="min-w-0 px-3 py-3">
          <h4 className="text-[10px] uppercase tracking-caps text-ink-3">SemVer verdict</h4>
          <div
            className={cn(
              'mt-2 rounded-sm p-2 text-[11px]',
              verdict.bump === 'major'
                ? 'bg-sev-err-soft text-sev-err'
                : verdict.bump === 'minor'
                  ? 'bg-sev-warn-soft text-sev-warn'
                  : 'bg-sev-info-soft text-sev-info',
            )}
          >
            <div className="font-mono text-md">{verdict.bump.toUpperCase()}</div>
            <p className="mt-1">{verdict.reason}</p>
          </div>

          <h4 className="mt-3 text-[10px] uppercase tracking-caps text-ink-3">Auto changelog</h4>
          <div className="mt-1.5">
            <CodeBlock code={changelog} language="md" maxHeight={300} showLineNumbers={false} />
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
