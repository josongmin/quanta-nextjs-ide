import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  THREADS,
  filterThreads,
  type Thread,
  type ThreadFilter,
  type ThreadStatus,
} from './helpers';

export type { Thread, ThreadStatus, ThreadFilter } from './helpers';

const FILTERS: ReadonlyArray<{ id: ThreadFilter; label: string }> = [
  { id: 'open', label: 'Open' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'mine', label: 'Mine' },
  { id: 'mentions', label: '@me' },
];

function statusTone(s: ThreadStatus): 'accent' | 'muted' | 'warn' {
  if (s === 'resolved') return 'muted';
  if (s === 'outdated') return 'warn';
  return 'accent';
}

function firstLine(thread: Thread): string {
  const first = thread.posts[0];
  if (!first) return '(no posts)';
  return first.body.replace(/[*_`]/g, '');
}

function initialsOf(name: string): string {
  const parts = name.split(' ');
  const a = parts[0]?.[0] ?? '';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function colorFor(name: string): string {
  const palette = ['#2F6BFF', '#E0488B', '#19A37F', '#B86BFF', '#E29A2B', '#1FA2C2'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length] ?? '#2F6BFF';
}

// Minimal markdown-light: **bold**, _italic_, `code`.
function MdLight({ text }: { text: string }) {
  // Tokenize without regex backrefs to keep TS simple.
  const parts: Array<{ type: 'b' | 'i' | 'c' | 't'; text: string }> = [];
  let buf = '';
  let i = 0;
  const flush = () => {
    if (buf) parts.push({ type: 't', text: buf });
    buf = '';
  };
  while (i < text.length) {
    const ch = text[i];
    if (ch === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        flush();
        parts.push({ type: 'b', text: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if (ch === '_') {
      const end = text.indexOf('_', i + 1);
      if (end !== -1) {
        flush();
        parts.push({ type: 'i', text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        flush();
        parts.push({ type: 'c', text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    buf += ch ?? '';
    i++;
  }
  flush();
  return (
    <span>
      {parts.map((p, idx) => {
        if (p.type === 'b') return <strong key={idx} className="text-ink-1">{p.text}</strong>;
        if (p.type === 'i') return <em key={idx} className="italic">{p.text}</em>;
        if (p.type === 'c')
          return (
            <code
              key={idx}
              className="rounded-sm border border-line bg-bg-subtle px-1 font-mono text-[10.5px] text-ink-1"
            >
              {p.text}
            </code>
          );
        return <span key={idx}>{p.text}</span>;
      })}
    </span>
  );
}

export function CommentThreadOverlay() {
  const open = useUiStore((s) => s.overlays.commentThread.open);
  const initial = useUiStore((s) => s.overlays.commentThread.threadId);
  const close = useUiStore((s) => s.closeOverlay);

  const [filter, setFilter] = useState<ThreadFilter>('open');
  const [selectedId, setSelectedId] = useState<string>(initial ?? THREADS[0]?.id ?? '');
  const [draft, setDraft] = useState('');

  const filtered = useMemo(() => filterThreads(THREADS, filter), [filter]);

  const selected = useMemo<Thread | undefined>(
    () => THREADS.find((t) => t.id === selectedId) ?? filtered[0] ?? THREADS[0],
    [selectedId, filtered],
  );

  const onSend = () => {
    if (!draft.trim() || !selected) return;
    toast.success('Reply posted (mock)', {
      description: `${selected.file}:${selected.line} · ${draft.length} chars`,
    });
    setDraft('');
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('commentThread')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Doc className="h-4 w-4 text-ink-3" />
          <span>Comments</span>
        </span>
      }
      subtitle="line-anchored review threads"
      size="md"
      footer={
        <>
          {selected ? (
            <>
              <Button
                size="sm"
                tone="ghost"
                onClick={() => toast('Marked outdated (mock)', { description: selected.file })}
              >
                Mark outdated
              </Button>
              {selected.status === 'resolved' ? (
                <Button
                  size="sm"
                  tone="soft"
                  onClick={() => toast('Reopened thread (mock)', { description: selected.file })}
                >
                  Reopen
                </Button>
              ) : (
                <Button
                  size="sm"
                  tone="accent"
                  onClick={() =>
                    toast.success('Resolved thread (mock)', { description: selected.file })
                  }
                >
                  Resolve
                </Button>
              )}
            </>
          ) : null}
        </>
      }
    >
      <div className="grid grid-cols-[260px_1fr] divide-x divide-line">
        {/* Left rail */}
        <aside className="min-w-0">
          <div className="flex flex-wrap gap-1 px-2 py-2 hairline-b bg-bg-subtle">
            {FILTERS.map((f) => (
              <ToggleChip
                key={f.id}
                active={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </ToggleChip>
            ))}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {filtered.map((t) => {
              const isSel = selected?.id === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      'block w-full px-2 py-2 text-left hairline-b hover:bg-bg-hover',
                      isSel && 'bg-bg-selected',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Chip tone={statusTone(t.status)} size="xs">
                        {t.status}
                      </Chip>
                      <span className="ml-auto font-mono text-[10px] text-ink-3">
                        {t.posts.length} post{t.posts.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-ink-1">{firstLine(t)}</p>
                    <p
                      className="mt-0.5 truncate font-mono text-[10px] text-ink-3"
                      title={`${t.file}:${t.line}`}
                    >
                      {t.file}:{t.line}
                    </p>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 ? (
              <li className="px-2 py-6 text-center text-[11px] text-ink-3">No threads.</li>
            ) : null}
          </ul>
        </aside>

        {/* Main thread */}
        <section className="min-w-0">
          {!selected ? (
            <div className="p-6 text-center text-xs text-ink-3">Select a thread.</div>
          ) : (
            <div className="flex h-full max-h-[68vh] flex-col">
              <div className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
                <button
                  type="button"
                  onClick={() =>
                    toast('Jumped to source', {
                      description: `${selected.file}:${selected.line}`,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 hover:bg-bg-hover"
                >
                  <Icon.File className="h-3 w-3 text-ink-3" />
                  <span className="truncate" title={`${selected.file}:${selected.line}`}>
                    {selected.file}:{selected.line}
                  </span>
                </button>
                <Chip tone={statusTone(selected.status)} size="xs" className="ml-auto">
                  {selected.status}
                </Chip>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                <ul className="space-y-3">
                  {selected.posts.map((p, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span
                        aria-hidden
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: colorFor(p.author) }}
                      >
                        {initialsOf(p.author)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-ink-1">{p.author}</span>
                          <span className="font-mono text-[10px] text-ink-3">{p.ts} ago</span>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-snug text-ink-2">
                          <MdLight text={p.body} />
                        </p>
                        {idx === selected.posts.length - 1 && selected.reactions.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selected.reactions.map((r) => (
                              <button
                                key={r.emoji}
                                type="button"
                                onClick={() =>
                                  toast(`Reaction +1 ${r.emoji} (mock)`, {
                                    description: selected.file,
                                  })
                                }
                                className="inline-flex h-5 items-center gap-1 rounded-full border border-line bg-bg px-1.5 text-[11px] hover:bg-bg-hover"
                              >
                                <span>{r.emoji}</span>
                                <span className="text-ink-3">{r.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => toast('Reply mode (mock)', { description: p.author })}
                          className="mt-1 text-[10px] text-ink-3 hover:text-accent"
                        >
                          Reply
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hairline-t bg-bg-subtle/40 p-3">
                <button
                  type="button"
                  onClick={() =>
                    setDraft(
                      'Looks reasonable to me — let’s add a unit test for the edge case.',
                    )
                  }
                  className="mb-2 inline-flex items-center gap-1 rounded-full border border-line bg-bg px-2 py-0.5 text-[11px] text-ink-2 hover:bg-bg-hover"
                >
                  <Icon.Bulb className="h-3 w-3 text-accent" />
                  <span>Suggest AI reply</span>
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a reply…"
                  rows={3}
                  className={cn(
                    'block w-full resize-none rounded-sm border border-line bg-bg p-2 font-mono text-[11px] text-ink-1',
                    'focus:border-accent focus:outline-none',
                  )}
                />
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className="mr-auto text-[10px] text-ink-3">{draft.length} chars</span>
                  <Button size="sm" tone="ghost" onClick={() => setDraft('')}>
                    Clear
                  </Button>
                  <Button size="sm" tone="accent" onClick={onSend}>
                    <Icon.UpRight className="h-3.5 w-3.5" /> Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </OverlayPanel>
  );
}
