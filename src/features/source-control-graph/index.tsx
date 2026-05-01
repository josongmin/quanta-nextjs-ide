import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  AUTHORS,
  BRANCHES,
  BRANCH_COLOR,
  BRANCH_LANES,
  COMMITS,
  relTime,
  type BranchName,
  type Commit,
} from './helpers';

const ROW_H = 28;
const LANE_X = (lane: number) => 16 + lane * 28;

interface Layout {
  rows: ReadonlyArray<{ commit: Commit; y: number; lane: number }>;
  index: Record<string, { y: number; lane: number }>;
  height: number;
}

function buildLayout(commits: ReadonlyArray<Commit>): Layout {
  const sorted = commits.slice().sort((a, b) => b.ts - a.ts);
  const rows = sorted.map((c, i) => ({
    commit: c,
    y: 14 + i * ROW_H,
    lane: BRANCH_LANES[c.branch],
  }));
  const index: Record<string, { y: number; lane: number }> = {};
  rows.forEach((r) => {
    index[r.commit.sha] = { y: r.y, lane: r.lane };
  });
  return {
    rows,
    index,
    height: rows.length * ROW_H + 14,
  };
}

export function SourceControlGraphOverlay() {
  const open = useUiStore((s) => s.overlays.sourceControlGraph.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeBranches, setActiveBranches] =
    useState<ReadonlyArray<BranchName>>(BRANCHES);
  const [search, setSearch] = useState('');
  const [author, setAuthor] = useState<string>('all');
  const [selectedSha, setSelectedSha] = useState<string>(
    COMMITS[0]?.sha ?? '',
  );

  const filtered = useMemo<ReadonlyArray<Commit>>(() => {
    const q = search.trim().toLowerCase();
    return COMMITS.filter((c) => {
      if (!activeBranches.includes(c.branch)) return false;
      if (author !== 'all' && c.author !== author) return false;
      if (q && !c.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeBranches, author, search]);

  const layout = useMemo(() => buildLayout(filtered), [filtered]);

  const selected = useMemo(
    () =>
      COMMITS.find((c) => c.sha === selectedSha) ??
      filtered[0] ??
      COMMITS[0] ??
      null,
    [selectedSha, filtered],
  );

  const totalAdded = selected
    ? selected.filesChanged.reduce((acc, f) => acc + f.added, 0)
    : 0;
  const totalRemoved = selected
    ? selected.filesChanged.reduce((acc, f) => acc + f.removed, 0)
    : 0;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('sourceControlGraph'))}
      title="Source Control · Commit Graph"
      subtitle={`${COMMITS.length} commits across ${BRANCHES.length} branches`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-3">
            {BRANCHES.map((b) => (
              <span key={b} className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: BRANCH_COLOR[b] }}
                  aria-hidden
                />
                <span className="font-mono text-[10px]">{b}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button size="xs" tone="ghost" onClick={() => toast('Fetched origin (mock)')}>
              Fetch
            </Button>
            <Button size="xs" tone="default" onClick={() => toast('Pulled origin/main (mock)')}>
              Pull
            </Button>
            <Button
              size="xs"
              tone="accent"
              onClick={() =>
                toast(`Open PR for ${selected?.sha.slice(0, 7) ?? '—'}`)
              }
            >
              Open PR for selected
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('sourceControlGraph')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="search messages…"
          className="w-44"
        />
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          branches
        </span>
        {BRANCHES.map((b) => (
          <ToggleChip
            key={b}
            active={activeBranches.includes(b)}
            onClick={() =>
              setActiveBranches((prev) =>
                prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
              )
            }
          >
            <span
              className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: BRANCH_COLOR[b] }}
              aria-hidden
            />
            {b}
          </ToggleChip>
        ))}
        <span className="h-4 w-px bg-line" aria-hidden />
        <SelectControl
          label="author"
          value={author}
          onChange={setAuthor}
          options={[
            { value: 'all', label: 'all' },
            ...AUTHORS.map((a) => ({ value: a, label: a })),
          ]}
        />
      </PanelHeader>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="max-h-[64vh] overflow-y-auto">
          <div className="relative">
            <svg
              width={140}
              height={layout.height}
              className="absolute inset-y-0 left-0"
              aria-hidden
            >
              {layout.rows.map((r) =>
                r.commit.parents.map((pSha) => {
                  const p = layout.index[pSha];
                  if (!p) return null;
                  const x1 = LANE_X(r.lane);
                  const y1 = r.y;
                  const x2 = LANE_X(p.lane);
                  const y2 = p.y;
                  if (x1 === x2) {
                    return (
                      <line
                        key={`${r.commit.sha}-${pSha}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={BRANCH_COLOR[r.commit.branch]}
                        strokeWidth={1.5}
                      />
                    );
                  }
                  const cx = (x1 + x2) / 2;
                  const cy = (y1 + y2) / 2 + 6;
                  return (
                    <path
                      key={`${r.commit.sha}-${pSha}`}
                      d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                      fill="none"
                      stroke={BRANCH_COLOR[r.commit.branch]}
                      strokeWidth={1.5}
                    />
                  );
                }),
              )}
              {layout.rows.map((r) => {
                const isMerge = r.commit.parents.length > 1;
                const cx = LANE_X(r.lane);
                const isSel = r.commit.sha === selected?.sha;
                return (
                  <g key={r.commit.sha}>
                    <circle
                      cx={cx}
                      cy={r.y}
                      r={isMerge ? 5 : 4}
                      fill={isMerge ? '#fff' : BRANCH_COLOR[r.commit.branch]}
                      stroke={BRANCH_COLOR[r.commit.branch]}
                      strokeWidth={isSel ? 3 : 1.5}
                    />
                    {isSel ? (
                      <circle
                        cx={cx}
                        cy={r.y}
                        r={8}
                        fill="none"
                        stroke={BRANCH_COLOR[r.commit.branch]}
                        strokeOpacity={0.35}
                        strokeWidth={1}
                      />
                    ) : null}
                  </g>
                );
              })}
            </svg>
            <ul className="relative ml-[140px]">
              {layout.rows.map((r) => {
                const isSel = r.commit.sha === selected?.sha;
                return (
                  <li
                    key={r.commit.sha}
                    onClick={() => setSelectedSha(r.commit.sha)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 px-3 text-xs hover:bg-bg-hover',
                      isSel && 'bg-accent-soft/40',
                    )}
                    style={{ height: ROW_H }}
                  >
                    <span className="font-mono text-[11px] text-ink-3 w-16 shrink-0">
                      {r.commit.sha}
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-ink-1"
                      title={r.commit.message}
                    >
                      {r.commit.message}
                    </span>
                    <span className="hidden w-20 shrink-0 truncate text-[11px] text-ink-3 md:inline-block">
                      {r.commit.author}
                    </span>
                    <span className="w-16 shrink-0 text-right font-mono text-[10px] text-ink-3">
                      {relTime(r.commit.ts)}
                    </span>
                  </li>
                );
              })}
              {layout.rows.length === 0 && (
                <li className="px-3 py-8 text-center text-[11px] text-ink-3">
                  No commits match.
                </li>
              )}
            </ul>
          </div>
        </div>

        <aside className="max-h-[64vh] overflow-y-auto">
          {selected ? (
            <div className="px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-ink-3">
                    {selected.sha}
                  </div>
                  <div className="mt-1 text-sm font-medium text-ink-1">
                    {selected.message}
                  </div>
                  <div className="mt-1 text-[11px] text-ink-3">
                    {selected.author} · {relTime(selected.ts)}
                  </div>
                </div>
                <Chip
                  tone="muted"
                  size="xs"
                  className="shrink-0"
                  style={{
                    color: BRANCH_COLOR[selected.branch],
                    borderColor: BRANCH_COLOR[selected.branch],
                  }}
                >
                  {selected.branch}
                </Chip>
              </div>

              <div className="mt-3 rounded-sm border border-line bg-bg-subtle px-2 py-1.5 text-[11px]">
                <div className="text-caps mb-1 text-[10px] uppercase text-ink-3">
                  Parents
                </div>
                {selected.parents.length === 0 ? (
                  <div className="text-ink-3">root commit</div>
                ) : (
                  <ul className="space-y-0.5">
                    {selected.parents.map((p) => (
                      <li
                        key={p}
                        className="font-mono text-ink-1"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="text-caps text-ink-3">
                    Files ({selected.filesChanged.length})
                  </h4>
                  <div className="font-mono text-[10px] text-ink-3">
                    <span className="text-sem-static">+{totalAdded}</span>
                    {' / '}
                    <span className="text-sev-err">−{totalRemoved}</span>
                  </div>
                </div>
                <ul className="divide-y divide-line rounded-sm border border-line">
                  {selected.filesChanged.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 px-2 py-1 text-[11px]"
                    >
                      <span
                        className="min-w-0 flex-1 truncate font-mono text-ink-1"
                        title={f.path}
                      >
                        {f.path}
                      </span>
                      <Chip tone="static" size="xs">
                        +{f.added}
                      </Chip>
                      <Chip tone="err" size="xs">
                        −{f.removed}
                      </Chip>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => toast(`Cherry-pick ${selected.sha}`)}
                >
                  Cherry-pick
                </Button>
                <Button
                  size="xs"
                  tone="warn"
                  onClick={() => toast(`Reset to ${selected.sha}`)}
                >
                  Reset to here
                </Button>
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => toast(`Open diff for ${selected.sha}`)}
                >
                  Open diff
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-6 text-xs text-ink-3">
              Select a commit to inspect.
            </div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
