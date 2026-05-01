import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  Icon,
  OverlayPanel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  initialBreakpoints,
  KIND_LABELS,
  KIND_TONE,
  type Breakpoint,
  type BpKind,
} from './helpers';

const KINDS: ReadonlyArray<BpKind> = ['line', 'condition', 'log', 'trace'];

interface FormState {
  kind: BpKind;
  file: string;
  line: string;
  condition: string;
  logMessage: string;
}

const emptyForm: FormState = {
  kind: 'line',
  file: '',
  line: '',
  condition: '',
  logMessage: '',
};

export function BreakpointManagerOverlay() {
  const open = useUiStore((s) => s.overlays.breakpointManager.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [list, setList] = useState<Breakpoint[]>(() => [...initialBreakpoints]);
  const [kindFilter, setKindFilter] = useState<Set<BpKind>>(new Set());
  const [search, setSearch] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = useMemo(() => {
    return list.filter((b) => {
      if (kindFilter.size > 0 && !kindFilter.has(b.kind)) return false;
      if (search && !b.file.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [list, kindFilter, search]);

  const stats = useMemo(() => {
    return list.reduce(
      (acc, b) => {
        if (b.enabled) acc.enabled += 1;
        if (b.kind === 'condition') acc.cond += 1;
        if (b.kind === 'log') acc.log += 1;
        return acc;
      },
      { enabled: 0, cond: 0, log: 0 },
    );
  }, [list]);

  const toggle = (id: string) =>
    setList((l) => l.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  const remove = (id: string) =>
    setList((l) => l.filter((b) => b.id !== id));

  const submitNew = () => {
    const ln = Number.parseInt(form.line, 10);
    if (!form.file.trim() || !Number.isFinite(ln) || ln <= 0) {
      toast.error('File and line are required');
      return;
    }
    const id = `bp_${Math.random().toString(36).slice(2, 7)}`;
    setList((l) => [
      ...l,
      {
        id,
        kind: form.kind,
        file: form.file.trim(),
        line: ln,
        condition: form.condition.trim() || undefined,
        logMessage: form.logMessage.trim() || undefined,
        hitCount: 0,
        enabled: true,
      },
    ]);
    setForm(emptyForm);
    setAdding(false);
    toast(`Breakpoint added at ${form.file}:${ln}`);
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('breakpointManager'))}
      title="Breakpoints"
      subtitle="line · condition · log · trace"
      size="md"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <span>
            enabled:{' '}
            <span className="font-mono text-ink-1">{stats.enabled}</span>
          </span>
          <span>
            conditional:{' '}
            <span className="font-mono text-ink-1">{stats.cond}</span>
          </span>
          <span>
            log points:{' '}
            <span className="font-mono text-ink-1">{stats.log}</span>
          </span>
          <span className="ml-auto font-mono">{filtered.length} shown</span>
        </span>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <Button
          size="xs"
          tone="default"
          onClick={() => setAdding((v) => !v)}
        >
          <Icon.Plus className="h-3 w-3" /> Add breakpoint
        </Button>
        <span className="ml-2 text-caps text-ink-3">kind</span>
        <div className="flex items-center gap-1">
          {KINDS.map((k) => (
            <ToggleChip
              key={k}
              active={kindFilter.has(k)}
              onClick={() => {
                setKindFilter((prev) => {
                  const n = new Set(prev);
                  if (n.has(k)) n.delete(k);
                  else n.add(k);
                  return n;
                });
              }}
            >
              {KIND_LABELS[k]}
            </ToggleChip>
          ))}
        </div>
        <div className="ml-auto w-44">
          <SearchInput value={search} onChange={setSearch} placeholder="file" />
        </div>
      </div>

      {adding ? (
        <div className="space-y-2 hairline-b bg-bg-subtle/40 px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="text-caps text-ink-3">kind</span>
            <div className="flex items-center gap-1">
              {KINDS.map((k) => (
                <ToggleChip
                  key={k}
                  active={form.kind === k}
                  onClick={() => setForm((f) => ({ ...f, kind: k }))}
                >
                  {KIND_LABELS[k]}
                </ToggleChip>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <input
              value={form.file}
              onChange={(e) => setForm((f) => ({ ...f, file: e.target.value }))}
              placeholder="src/path/to/file.tsx"
              className="h-7 rounded-sm border border-line bg-bg px-2 font-mono text-[11px] text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
            <input
              value={form.line}
              onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))}
              placeholder="line"
              type="number"
              min={1}
              className="h-7 rounded-sm border border-line bg-bg px-2 font-mono text-[11px] text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
          </div>
          {form.kind === 'condition' ? (
            <textarea
              value={form.condition}
              onChange={(e) =>
                setForm((f) => ({ ...f, condition: e.target.value }))
              }
              placeholder="condition (e.g. qty > 5)"
              rows={2}
              className="w-full rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
          ) : null}
          {form.kind === 'log' || form.kind === 'trace' ? (
            <textarea
              value={form.logMessage}
              onChange={(e) =>
                setForm((f) => ({ ...f, logMessage: e.target.value }))
              }
              placeholder="message (templates: {var})"
              rows={2}
              className="w-full rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
          ) : null}
          <div className="flex justify-end gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => {
                setAdding(false);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>
            <Button size="xs" tone="accent" onClick={submitNew}>
              Add
            </Button>
          </div>
        </div>
      ) : null}

      <div className="max-h-[440px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="hairline-b bg-bg-subtle text-left text-[10px] uppercase tracking-caps text-ink-3">
              <th className="w-7 px-2 py-1 font-medium" />
              <th className="px-2 py-1 font-medium">kind</th>
              <th className="px-2 py-1 font-medium">file:line</th>
              <th className="px-2 py-1 font-medium">condition</th>
              <th className="px-2 py-1 font-medium">log message</th>
              <th className="px-2 py-1 text-right font-medium">hits</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr
                key={b.id}
                className={cn(
                  'hairline-b last:border-b-0 hover:bg-bg-hover',
                  !b.enabled && 'opacity-50',
                )}
              >
                <td className="px-2 py-1">
                  <Switch
                    size="sm"
                    checked={b.enabled}
                    onCheckedChange={() => toggle(b.id)}
                    label={b.enabled ? 'Disable breakpoint' : 'Enable breakpoint'}
                  />
                </td>
                <td className="px-2 py-1">
                  <Chip tone={KIND_TONE[b.kind]} size="xs">
                    {KIND_LABELS[b.kind]}
                  </Chip>
                </td>
                <td className="max-w-[260px] truncate px-2 py-1 font-mono text-[11px] text-ink-1">
                  {b.file}
                  <span className="text-ink-3">:</span>
                  <span className="text-accent">{b.line}</span>
                </td>
                <td className="px-2 py-1 font-mono text-[11px] text-ink-2">
                  {b.condition ?? <span className="text-ink-3">—</span>}
                </td>
                <td className="max-w-[200px] truncate px-2 py-1 font-mono text-[11px] text-ink-2">
                  {b.logMessage ?? <span className="text-ink-3">—</span>}
                </td>
                <td className="px-2 py-1 text-right font-mono text-[11px] text-ink-2">
                  {b.hitCount}
                </td>
                <td className="px-1 text-right">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-ink-1"
                        aria-label="Actions"
                      >
                        <Icon.Cog className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="min-w-[160px] p-1 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => toast(`Edit ${b.file}:${b.line}`)}
                        className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-left text-ink-1 hover:bg-bg-hover"
                      >
                        <Icon.Code className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toast('Reveal in editor')}
                        className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-left text-ink-1 hover:bg-bg-hover"
                      >
                        <Icon.UpRight className="h-3 w-3" />
                        Reveal in editor
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(b.id)}
                        className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-left text-sev-err hover:bg-sev-err-soft"
                      >
                        <Icon.X className="h-3 w-3" />
                        Delete
                      </button>
                    </PopoverContent>
                  </Popover>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-xs text-ink-3">
                  No breakpoints match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </OverlayPanel>
  );
}
