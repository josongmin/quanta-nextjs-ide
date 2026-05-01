import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  consoleEntries,
  LEVELS,
  levelGlyph,
  levelTone,
  safeRegex,
  SOURCES,
  type ConsoleEntry,
  type ConsoleLevel,
} from './helpers';

function EntryRow({ e }: { e: ConsoleEntry }) {
  const [open, setOpen] = useState(false);
  const tone = levelTone(e.level);
  return (
    <li className="hairline-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-bg-hover"
      >
        <span className="w-14 shrink-0 font-mono text-[10px] text-ink-3">
          T+{e.at}ms
        </span>
        <span
          className={cn(
            'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]',
            tone === 'err' && 'bg-sev-err-soft text-sev-err',
            tone === 'warn' && 'bg-sev-warn-soft text-sev-warn',
            tone === 'info' && 'bg-sev-info-soft text-sev-info',
            tone === 'isr' && 'bg-sem-isr-soft text-sem-isr',
            tone === 'muted' && 'bg-bg-subtle text-ink-3',
          )}
        >
          {levelGlyph(e.level)}
        </span>
        <span
          className={cn(
            'flex-1 break-words font-mono text-[11px] leading-tight',
            e.level === 'error'
              ? 'text-sev-err'
              : e.level === 'warn'
                ? 'text-sev-warn'
                : 'text-ink-1',
          )}
        >
          {e.message}
        </span>
        <span className="ml-2 max-w-[180px] shrink-0 truncate text-[10px] text-ink-3">
          {e.source}
        </span>
        <Icon.ChevRight
          className={cn(
            'h-3 w-3 shrink-0 text-ink-3 transition-transform',
            open && 'rotate-90',
          )}
        />
      </button>
      {open ? (
        <div className="space-y-2 border-t border-line bg-bg-subtle/40 px-3 py-2">
          {e.args && e.args.length > 0 ? (
            <div>
              <div className="text-caps mb-1 text-ink-3">args</div>
              <CodeBlock
                code={e.args.join('\n')}
                showLineNumbers={false}
                maxHeight={120}
              />
            </div>
          ) : null}
          {e.stack && e.stack.length > 0 ? (
            <div>
              <div className="text-caps mb-1 text-ink-3">stack</div>
              <ul className="space-y-0.5 rounded-sm border border-line bg-bg p-1.5">
                {e.stack.map((frame, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => toast(`Open ${frame}`)}
                      className="block w-full truncate rounded-sm px-1.5 py-0.5 text-left font-mono text-[11px] text-ink-1 hover:bg-bg-hover"
                    >
                      {frame}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex justify-end gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => {
                navigator.clipboard?.writeText(e.message).catch(() => {});
                toast('Copied to clipboard');
              }}
            >
              Copy
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast(`Open ${e.source}`)}
            >
              Open source
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function ConsoleReplayOverlay() {
  const open = useUiStore((s) => s.overlays.consoleReplay.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [search, setSearch] = useState<string>('');
  const [levels, setLevels] = useState<Set<ConsoleLevel>>(new Set());
  const [source, setSource] = useState<string>('all');
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [tFrom, setTFrom] = useState<number>(0);
  const maxT = consoleEntries[consoleEntries.length - 1]?.at ?? 0;
  const [tTo, setTTo] = useState<number>(maxT);

  const regex = useMemo(
    () => (useRegex && search ? safeRegex(search) : null),
    [useRegex, search],
  );

  const filtered = useMemo(() => {
    return consoleEntries.filter((e) => {
      if (levels.size > 0 && !levels.has(e.level)) return false;
      if (source !== 'all' && !e.source.startsWith(source)) return false;
      if (e.at < tFrom || e.at > tTo) return false;
      if (search) {
        if (regex) {
          if (!regex.test(e.message)) return false;
        } else if (
          !e.message.toLowerCase().includes(search.toLowerCase())
        )
          return false;
      }
      return true;
    });
  }, [search, regex, levels, source, tFrom, tTo]);

  const stats = useMemo(() => {
    const m: Record<ConsoleLevel, number> = {
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    };
    filtered.forEach((e) => {
      m[e.level] += 1;
    });
    return m;
  }, [filtered]);

  const exportJson = () => {
    const payload = JSON.stringify(filtered, null, 2);
    navigator.clipboard?.writeText(payload).catch(() => {});
    toast(`Exported ${filtered.length} entries to clipboard`);
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('consoleReplay'))}
      title="Console Replay"
      subtitle="captured console output · filter · export"
      size="md"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          {LEVELS.map((l) => (
            <span key={l}>
              {l}:{' '}
              <span
                className={cn(
                  'font-mono',
                  l === 'error' && 'text-sev-err',
                  l === 'warn' && 'text-sev-warn',
                  l === 'info' && 'text-sev-info',
                  l === 'debug' && 'text-sem-isr',
                  l === 'log' && 'text-ink-1',
                )}
              >
                {stats[l]}
              </span>
            </span>
          ))}
          <span className="ml-auto flex gap-1.5">
            <Button size="xs" tone="ghost" onClick={exportJson}>
              Export to JSON
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => {
                setSearch('');
                setLevels(new Set());
                setSource('all');
                setTFrom(0);
                setTTo(maxT);
                toast('Filters cleared');
              }}
            >
              Clear
            </Button>
          </span>
        </span>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <div className="w-44">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={useRegex ? 'pattern' : 'message contains'}
          />
        </div>
        <ToggleChip active={useRegex} onClick={() => setUseRegex((v) => !v)}>
          .* regex
        </ToggleChip>
        <span className="ml-1 text-caps text-ink-3">level</span>
        <div className="flex items-center gap-1">
          {LEVELS.map((l) => (
            <ToggleChip
              key={l}
              active={levels.has(l)}
              onClick={() => {
                setLevels((prev) => {
                  const n = new Set(prev);
                  if (n.has(l)) n.delete(l);
                  else n.add(l);
                  return n;
                });
              }}
            >
              {l}
            </ToggleChip>
          ))}
        </div>
        <SelectControl
          label="src"
          value={source}
          onChange={setSource}
          options={[
            { value: 'all', label: 'all' },
            ...SOURCES.map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>
      <div className="flex h-8 items-center gap-2 hairline-b bg-bg-subtle/60 px-3 text-[11px]">
        <span className="text-caps text-ink-3">range</span>
        <input
          type="range"
          min={0}
          max={maxT}
          value={tFrom}
          onChange={(e) =>
            setTFrom(Math.min(tTo, Number(e.target.value)))
          }
          className="w-32"
        />
        <span className="font-mono text-[10px] text-ink-3">{tFrom}ms</span>
        <span className="text-ink-3">→</span>
        <input
          type="range"
          min={0}
          max={maxT}
          value={tTo}
          onChange={(e) => setTTo(Math.max(tFrom, Number(e.target.value)))}
          className="w-32"
        />
        <span className="font-mono text-[10px] text-ink-3">{tTo}ms</span>
        <span className="ml-auto text-[11px] text-ink-3">
          {filtered.length} / {consoleEntries.length} entries
        </span>
        {regex === null && useRegex && search ? (
          <Chip tone="err" size="xs">
            invalid regex
          </Chip>
        ) : null}
      </div>

      <ul className="max-h-[440px] overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-center text-xs text-ink-3">
            No console entries match.
          </li>
        ) : (
          filtered.map((e) => <EntryRow key={e.id} e={e} />)
        )}
      </ul>
    </OverlayPanel>
  );
}
