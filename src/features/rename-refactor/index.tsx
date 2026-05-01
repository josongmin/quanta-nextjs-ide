import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Chip, Icon, OverlayPanel, ScrollArea } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  TARGET,
  bucketByFile,
  type Occurrence,
  type OccurrenceKind,
  type Scope,
} from './helpers';

const KIND_TONE: Record<OccurrenceKind, 'accent' | 'static' | 'isr' | 'muted' | 'info'> = {
  def: 'accent',
  read: 'static',
  write: 'isr',
  comment: 'muted',
  string: 'info',
};

const SCOPE_OPTIONS: ReadonlyArray<{ value: Scope; label: string }> = [
  { value: 'project', label: 'Project' },
  { value: 'file', label: 'This file' },
  { value: 'selection', label: 'Selection' },
];

export function RenameRefactorOverlay() {
  const open = useUiStore((s) => s.overlays.renameRefactor.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [newName, setNewName] = useState(TARGET.defaultNewName);
  const [scope, setScope] = useState<Scope>('project');
  const [matchComments, setMatchComments] = useState(true);
  const [matchStrings, setMatchStrings] = useState(false);
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const filtered = useMemo(() => {
    return TARGET.occurrences.filter((o) => {
      if (o.kind === 'comment' && !matchComments) return false;
      if (o.kind === 'string' && !matchStrings) return false;
      if (scope === 'file') {
        const defFile = TARGET.occurrences.find((x) => x.kind === 'def')?.file;
        return o.file === defFile;
      }
      if (scope === 'selection') {
        return o.kind === 'def' || o.kind === 'read';
      }
      return true;
    });
  }, [matchComments, matchStrings, scope]);

  const buckets = useMemo(() => bucketByFile(filtered), [filtered]);
  const includedCount = filtered.filter((o) => !excluded.has(o.id)).length;
  const fileCount = new Set(
    filtered.filter((o) => !excluded.has(o.id)).map((o) => o.file),
  ).size;

  const toggleOcc = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFile = (file: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  };

  const apply = () => {
    toast('Apply rename', {
      description: `${TARGET.oldName} -> ${newName} · ${includedCount} occurrences in ${fileCount} files`,
    });
    close('renameRefactor');
  };

  const savePreset = () => {
    toast('Saved as preset', {
      description: `Rename ${TARGET.oldName} -> ${newName} (scope=${scope})`,
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('renameRefactor')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Refresh className="h-4 w-4 text-ink-3" />
          <span>Rename refactor</span>
        </span>
      }
      size="lg"
      footer={
        <>
          <button
            onClick={() => {
              toast('Cancelled');
              close('renameRefactor');
            }}
            className="inline-flex h-7 items-center gap-1 rounded-sm border border-line bg-bg px-2.5 text-xs text-ink-2 hover:bg-bg-hover"
          >
            Cancel
          </button>
          <button
            onClick={savePreset}
            className="inline-flex h-7 items-center gap-1 rounded-sm border border-line bg-bg px-2.5 text-xs text-ink-2 hover:bg-bg-hover"
          >
            <Icon.Pin className="h-3 w-3" /> Save as preset
          </button>
          <button
            onClick={apply}
            disabled={includedCount === 0 || newName.trim().length === 0}
            className="inline-flex h-7 items-center gap-1 rounded-sm border border-accent bg-accent px-2.5 text-xs text-white hover:bg-accent/90 disabled:opacity-40"
          >
            <Icon.Refresh className="h-3 w-3" /> Apply rename ({includedCount})
          </button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_260px] divide-x divide-line">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b">
            <Chip tone="muted" size="sm" className="font-mono">
              {TARGET.oldName}
            </Chip>
            <Icon.Right className="h-3 w-3 text-ink-3" />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="newName"
              className="h-7 w-44 rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <SelectControl
              label="Scope"
              value={scope}
              options={SCOPE_OPTIONS}
              onChange={(v) => setScope(v)}
            />
            <ToggleChip
              active={matchComments}
              onClick={() => setMatchComments((v) => !v)}
              title="Include matches in // comments"
            >
              Match comments
            </ToggleChip>
            <ToggleChip
              active={matchStrings}
              onClick={() => setMatchStrings((v) => !v)}
              title="Include matches in 'strings'"
            >
              Match strings
            </ToggleChip>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <ul>
              {buckets.map((bucket) => {
                const isCollapsed = collapsed.has(bucket.file);
                const includedInFile = bucket.occurrences.filter(
                  (o) => !excluded.has(o.id),
                ).length;
                return (
                  <li
                    key={bucket.file}
                    className="hairline-b last:border-b-0"
                  >
                    <header className="flex items-center gap-2 bg-bg-subtle px-3 py-1.5">
                      <button
                        onClick={() => toggleFile(bucket.file)}
                        className="flex h-5 w-4 items-center justify-center text-ink-3 hover:text-ink-1"
                        aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                      >
                        {isCollapsed ? (
                          <Icon.ChevRight className="h-3 w-3" />
                        ) : (
                          <Icon.ChevDown className="h-3 w-3" />
                        )}
                      </button>
                      <Icon.File className="h-3 w-3 text-ink-3" />
                      <span className="truncate font-mono text-[11px] text-ink-1">
                        {bucket.file}
                      </span>
                      <Chip tone="muted" size="xs" className="ml-auto">
                        {includedInFile} / {bucket.occurrences.length}
                      </Chip>
                    </header>
                    {isCollapsed ? null : (
                      <ul>
                        {bucket.occurrences.map((occ) => (
                          <OccurrenceRow
                            key={occ.id}
                            occ={occ}
                            newName={newName}
                            excluded={excluded.has(occ.id)}
                            onToggle={() => toggleOcc(occ.id)}
                          />
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
            <Icon.Info className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Summary</span>
          </header>
          <div className="space-y-3 p-3 text-[11px]">
            <div className="rounded-sm border border-line bg-bg-subtle p-2">
              <div className="font-mono text-ink-1">
                {includedCount} occurrence
                {includedCount === 1 ? '' : 's'}
              </div>
              <div className="text-ink-3">
                across {fileCount} file{fileCount === 1 ? '' : 's'}
              </div>
            </div>
            <div>
              <div className="mb-1 text-caps text-ink-3">By kind</div>
              <ul className="space-y-1">
                {(['def', 'read', 'write', 'comment', 'string'] as const).map(
                  (k) => {
                    const count = filtered.filter(
                      (o) => o.kind === k && !excluded.has(o.id),
                    ).length;
                    return (
                      <li
                        key={k}
                        className="flex items-center justify-between"
                      >
                        <Chip tone={KIND_TONE[k]} size="xs">
                          {k}
                        </Chip>
                        <span className="font-mono text-ink-2">{count}</span>
                      </li>
                    );
                  },
                )}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-caps text-ink-3">
                Conflicts ({TARGET.conflicts.length})
              </div>
              <ul className="space-y-1.5">
                {TARGET.conflicts.map((c) => (
                  <li
                    key={c.id}
                    className={cn(
                      'rounded-sm border p-2',
                      c.severity === 'err'
                        ? 'border-sev-err/30 bg-sev-err-soft'
                        : 'border-sev-warn/30 bg-sev-warn-soft',
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <Chip
                        tone={c.severity === 'err' ? 'err' : 'warn'}
                        size="xs"
                      >
                        {c.severity}
                      </Chip>
                    </div>
                    <p
                      className={cn(
                        'mt-1 text-[11px]',
                        c.severity === 'err'
                          ? 'text-sev-err'
                          : 'text-sev-warn',
                      )}
                    >
                      {c.message}
                    </p>
                    {c.file ? (
                      <p className="mt-0.5 font-mono text-[10px] text-ink-3">
                        {c.file}
                        {c.line ? `:${c.line}` : ''}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function OccurrenceRow({
  occ,
  newName,
  excluded,
  onToggle,
}: {
  occ: Occurrence;
  newName: string;
  excluded: boolean;
  onToggle(): void;
}) {
  return (
    <li>
      <div
        className={cn(
          'flex items-start gap-2 px-3 py-1.5 hover:bg-bg-hover',
          excluded && 'opacity-50',
        )}
      >
        <input
          type="checkbox"
          checked={!excluded}
          onChange={onToggle}
          aria-label="Include occurrence"
          className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-accent"
        />
        <Chip tone={KIND_TONE[occ.kind]} size="xs">
          {occ.kind}
        </Chip>
        <div className="min-w-0 flex-1">
          <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-ink-1">
            {occ.segments.map((s, i) =>
              s.match ? (
                <span key={i} className="inline-flex items-baseline gap-0">
                  <span className="bg-sev-err-soft text-sev-err line-through decoration-sev-err">
                    {s.text}
                  </span>
                  <span className="bg-sem-static-soft text-sem-static underline decoration-sem-static">
                    {newName.length > 0 ? newName : s.text}
                  </span>
                </span>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </pre>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-ink-3">
          :{occ.line}
        </span>
      </div>
    </li>
  );
}
