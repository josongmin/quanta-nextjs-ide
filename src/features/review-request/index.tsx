import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  CHANGED_FILES,
  CHECKLIST,
  REVIEWERS,
  type Availability,
  type Reviewer,
} from './helpers';

export type { Availability, Reviewer, ChangedFile } from './helpers';

function availTone(a: Availability): 'accent' | 'warn' | 'muted' {
  if (a === 'available') return 'accent';
  if (a === 'busy') return 'warn';
  return 'muted';
}

const AVAIL_LABEL: Record<Availability, string> = {
  available: 'Available',
  busy: 'Busy',
  out: 'Out',
};

function colorFor(name: string): string {
  const palette = ['#2F6BFF', '#E0488B', '#19A37F', '#B86BFF', '#E29A2B', '#1FA2C2'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length] ?? '#2F6BFF';
}

export function ReviewRequestOverlay() {
  const open = useUiStore((s) => s.overlays.reviewRequest.open);
  const close = useUiStore((s) => s.closeOverlay);

  const ranked = useMemo(() => [...REVIEWERS].sort((a, b) => b.score - a.score), []);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ranked.slice(0, 2).map((r) => r.id)),
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleReviewer = (r: Reviewer) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(r.id)) next.delete(r.id);
      else next.add(r.id);
      return next;
    });
  };

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSend = () => {
    const names = ranked
      .filter((r) => selected.has(r.id))
      .map((r) => r.name)
      .join(', ');
    toast.success('Review request sent (mock)', {
      description: names ? `To: ${names}` : 'No reviewers selected.',
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('reviewRequest')}
      title={
        <span className="flex items-center gap-2">
          <Icon.UpRight className="h-4 w-4 text-ink-3" />
          <span>Request review</span>
        </span>
      }
      subtitle="smart reviewer routing · checklist · scoped diff"
      size="md"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {selected.size} reviewer{selected.size === 1 ? '' : 's'} · {checked.size}/{CHECKLIST.length} checks
          </span>
          <Button size="sm" tone="ghost" onClick={() => close('reviewRequest')}>
            Cancel
          </Button>
          <Button size="sm" tone="accent" onClick={onSend}>
            <Icon.UpRight className="h-3.5 w-3.5" /> Send review request
          </Button>
        </>
      }
    >
      <div className="space-y-0">
        {/* Section 1: Changed files */}
        <section className="px-4 py-3 hairline-b">
          <header className="mb-2 flex items-center gap-2">
            <span className="text-caps text-ink-3">Changed files</span>
            <Chip tone="muted" size="xs">
              {CHANGED_FILES.length}
            </Chip>
          </header>
          <ul className="grid grid-cols-2 gap-1.5">
            {CHANGED_FILES.map((cf) => (
              <li
                key={cf.file}
                className="flex items-center gap-2 rounded-sm border border-line bg-bg-subtle/40 px-2 py-1"
              >
                <Icon.File className="h-3 w-3 shrink-0 text-ink-3" />
                <span className="truncate font-mono text-[11px] text-ink-1" title={cf.file}>
                  {cf.file}
                </span>
                <Chip tone="info" size="xs" className="ml-auto">
                  {cf.area}
                </Chip>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 2: Suggested reviewers */}
        <section className="px-4 py-3 hairline-b">
          <header className="mb-2 flex items-center gap-2">
            <span className="text-caps text-ink-3">Suggested reviewers</span>
            <span className="text-[10px] text-ink-3">ranked by relevance</span>
          </header>
          <ul className="space-y-1.5">
            {ranked.map((r) => {
              const isSel = selected.has(r.id);
              return (
                <li key={r.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-sm border border-line bg-bg px-2 py-2 hover:bg-bg-hover',
                      isSel && 'border-accent bg-accent-soft/30',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleReviewer(r)}
                      className="h-3.5 w-3.5 accent-accent"
                    />
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: colorFor(r.name) }}
                    >
                      {r.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-ink-1">{r.name}</span>
                        <Chip tone={availTone(r.availability)} size="xs">
                          {AVAIL_LABEL[r.availability]}
                        </Chip>
                        <div className="ml-auto flex w-20 items-center gap-1">
                          <span className="font-mono text-[10px] text-ink-3">{r.score}</span>
                          <ScoreBar value={r.score} />
                        </div>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-2">{r.reason}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.expertise.map((tag) => (
                          <Chip key={tag} tone="muted" size="xs">
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Section 3: Checklist */}
        <section className="px-4 py-3">
          <header className="mb-2 flex items-center gap-2">
            <span className="text-caps text-ink-3">Review checklist</span>
            <Chip tone="muted" size="xs">
              {checked.size}/{CHECKLIST.length}
            </Chip>
          </header>
          <ul className="space-y-1">
            {CHECKLIST.map((c) => {
              const isOn = checked.has(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggleCheck(c.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1.5 text-left text-[11px] hover:bg-bg-hover',
                      isOn && 'border-accent bg-accent-soft/40',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                        isOn ? 'border-accent bg-accent text-white' : 'border-line bg-bg',
                      )}
                    >
                      {isOn ? '✓' : ''}
                    </span>
                    <span className={cn('flex-1', isOn ? 'text-ink-1' : 'text-ink-2')}>
                      {c.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </OverlayPanel>
  );
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <span className="relative inline-block h-1.5 flex-1 overflow-hidden rounded-full bg-bg-subtle">
      <span
        className="absolute left-0 top-0 h-full rounded-full bg-accent"
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}
