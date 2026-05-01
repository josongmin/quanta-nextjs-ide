/**
 * Ownership Graph overlay.
 *
 * 3-pane layout:
 *  - LEFT: file tree colored by team (each leaf shows a colored dot).
 *  - MIDDLE: team list with avatars, file counts, senior tags.
 *  - RIGHT: recent changes panel — input a list of changed files and
 *           see which teams are touched + suggested reviewers.
 */

import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { ownersFor } from './parser';
import { useOwnershipStore } from './store';
import { TeamCard } from './team-card';
import { inferCriticality, suggestReviewers, type Criticality, type Reviewer } from './assigner';

const SAMPLE_TREE: ReadonlyArray<string> = [
  'src/app/checkout/page.tsx',
  'src/app/account/page.tsx',
  'src/components/CartButton.tsx',
  'src/components/Header.tsx',
  'src/lib/auth/session.ts',
  'src/lib/services/payment-gateway.ts',
  'src/lib/db/orders.ts',
];

export function OwnershipGraphOverlay() {
  const open = useUiStore((s) => s.overlays.ownershipGraph.open);
  const close = useUiStore((s) => s.closeOverlay);

  const rules = useOwnershipStore((s) => s.rules);
  const teams = useOwnershipStore((s) => s.teams);
  const overrides = useOwnershipStore((s) => s.overrides);
  const raw = useOwnershipStore((s) => s.rawCodeowners);
  const setRaw = useOwnershipStore((s) => s.setRawCodeowners);
  const parseErrors = useOwnershipStore((s) => s.parseErrors);

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [changedFilesText, setChangedFilesText] = useState<string>(SAMPLE_TREE.slice(0, 3).join('\n'));
  const [criticalityOverride, setCriticalityOverride] = useState<Criticality | 'auto'>('auto');

  const fileOwners = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const file of SAMPLE_TREE) {
      map.set(file, [...ownersFor(file, rules)]);
    }
    return map;
  }, [rules]);

  const teamFileCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const owners of fileOwners.values()) {
      for (const owner of owners) counts.set(owner, (counts.get(owner) ?? 0) + 1);
    }
    return counts;
  }, [fileOwners]);

  const changedFiles = useMemo(
    () =>
      changedFilesText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    [changedFilesText],
  );

  const criticality: Criticality = useMemo(() => {
    if (criticalityOverride !== 'auto') return criticalityOverride;
    return inferCriticality(changedFiles);
  }, [criticalityOverride, changedFiles]);

  const reviewers: Reviewer[] = useMemo(
    () => suggestReviewers({ changedFiles, rules, overrides, teams, criticality }),
    [changedFiles, rules, overrides, teams, criticality],
  );

  const touchedTeams = useMemo(() => {
    const seen = new Set<string>();
    for (const file of changedFiles) {
      for (const owner of ownersFor(file, rules)) seen.add(owner);
    }
    return [...seen];
  }, [changedFiles, rules]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('ownershipGraph'))}
      title={<span className="flex items-center gap-2">Ownership Graph</span>}
      subtitle={
        <span className="font-mono text-[11px] text-ink-3">
          {rules.length} CODEOWNERS rules · {Object.keys(teams).length} teams
          {parseErrors.length ? ` · ${parseErrors.length} parse errors` : ''}
        </span>
      }
      size="xl"
      footer={
        <Button size="sm" tone="ghost" onClick={() => close('ownershipGraph')}>
          Close
        </Button>
      }
    >
      <div className="grid grid-cols-[1.1fr_0.9fr_1.2fr] divide-x divide-line">
        <FileTreePane
          files={SAMPLE_TREE}
          fileOwners={fileOwners}
          teams={teams}
          highlight={selectedTeam}
        />
        <TeamListPane
          teams={teams}
          counts={teamFileCount}
          selected={selectedTeam}
          onSelect={(id) => setSelectedTeam((cur) => (cur === id ? null : id))}
        />
        <ChangePane
          changedText={changedFilesText}
          onChangedText={setChangedFilesText}
          rawCodeowners={raw}
          setRawCodeowners={setRaw}
          touched={touchedTeams}
          teams={teams}
          reviewers={reviewers}
          criticality={criticality}
          onCriticality={setCriticalityOverride}
          criticalityOverride={criticalityOverride}
        />
      </div>
    </OverlayPanel>
  );
}

function FileTreePane({
  files,
  fileOwners,
  teams,
  highlight,
}: {
  files: ReadonlyArray<string>;
  fileOwners: Map<string, string[]>;
  teams: Record<string, import('./store').TeamMeta>;
  highlight: string | null;
}) {
  return (
    <section className="min-w-0 p-3">
      <header className="mb-2 text-caps text-ink-3">Files (sample)</header>
      <ScrollArea className="max-h-[460px]">
        <ul className="space-y-0.5 font-mono text-[12px]">
          {files.map((file) => {
            const owners = fileOwners.get(file) ?? [];
            const dimmed = highlight !== null && !owners.includes(highlight);
            return (
              <li
                key={file}
                className={cn(
                  'flex items-center gap-2 rounded px-1.5 py-1',
                  dimmed && 'opacity-40',
                )}
              >
                <span className="flex flex-shrink-0 items-center gap-0.5">
                  {owners.length === 0 && (
                    <span className="h-2.5 w-2.5 rounded-full border border-line/60 bg-bg" />
                  )}
                  {owners.map((o) => {
                    const team = teams[o];
                    return (
                      <span
                        key={o}
                        title={team?.label ?? o}
                        className="h-2.5 w-2.5 rounded-full border border-bg"
                        style={{ backgroundColor: team?.color ?? '#94a3b8' }}
                      />
                    );
                  })}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-1">{file}</span>
                <span className="text-[10px] text-ink-3">
                  {owners.map((o) => teams[o]?.label ?? o).join(', ') || 'unowned'}
                </span>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </section>
  );
}

function TeamListPane({
  teams,
  counts,
  selected,
  onSelect,
}: {
  teams: Record<string, import('./store').TeamMeta>;
  counts: Map<string, number>;
  selected: string | null;
  onSelect(id: string): void;
}) {
  return (
    <section className="min-w-0 p-3">
      <header className="mb-2 text-caps text-ink-3">Teams</header>
      <div className="space-y-1.5">
        {Object.values(teams).map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            fileCount={counts.get(team.id) ?? 0}
            highlight={selected === team.id}
            onClick={() => onSelect(team.id)}
          />
        ))}
        {!Object.keys(teams).length && (
          <div className="rounded-md border border-dashed border-line/60 px-3 py-4 text-center text-[12px] text-ink-3">
            No teams configured.
          </div>
        )}
      </div>
    </section>
  );
}

function ChangePane({
  changedText,
  onChangedText,
  rawCodeowners,
  setRawCodeowners,
  touched,
  teams,
  reviewers,
  criticality,
  criticalityOverride,
  onCriticality,
}: {
  changedText: string;
  onChangedText(s: string): void;
  rawCodeowners: string;
  setRawCodeowners(s: string): void;
  touched: ReadonlyArray<string>;
  teams: Record<string, import('./store').TeamMeta>;
  reviewers: ReadonlyArray<Reviewer>;
  criticality: Criticality;
  criticalityOverride: Criticality | 'auto';
  onCriticality(c: Criticality | 'auto'): void;
}) {
  return (
    <section className="min-w-0 p-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <span className="text-caps text-ink-3">Recent change</span>
        <Chip tone={criticality === 'high' || criticality === 'critical' ? 'err' : 'info'} size="xs">
          {criticality}
        </Chip>
      </header>

      <label className="mb-1 block text-[11px] text-ink-3">Changed files (one per line)</label>
      <textarea
        value={changedText}
        onChange={(e) => onChangedText(e.target.value)}
        className="h-24 w-full resize-y rounded-md border border-line/60 bg-bg px-2 py-1 font-mono text-[11px] text-ink-1 focus:border-accent focus:outline-none"
      />

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] text-ink-3">Criticality:</span>
        <select
          value={criticalityOverride}
          onChange={(e) => onCriticality(e.target.value as Criticality | 'auto')}
          className="rounded-md border border-line/60 bg-bg px-2 py-0.5 text-[11px] text-ink-1 focus:border-accent focus:outline-none"
        >
          <option value="auto">auto</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
      </div>

      <div className="mt-3">
        <header className="text-caps mb-1 text-ink-3">Touches teams</header>
        <div className="flex flex-wrap gap-1.5">
          {touched.map((id) => {
            const team = teams[id];
            return (
              <Chip key={id} size="sm" tone="info">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: team?.color ?? '#94a3b8' }}
                />
                {team?.label ?? id}
              </Chip>
            );
          })}
          {!touched.length && <span className="text-[11px] text-ink-3">(no owners matched)</span>}
        </div>
      </div>

      <div className="mt-3">
        <header className="text-caps mb-1 text-ink-3">Suggested reviewers</header>
        <ul className="space-y-0.5 text-[12px]">
          {reviewers.map((r) => (
            <li key={r.id} className="flex items-start gap-2 rounded px-1.5 py-1 hover:bg-bg-subtle">
              <Chip
                size="xs"
                tone={r.kind === 'senior' ? 'err' : r.kind === 'team' ? 'info' : 'neutral'}
              >
                {r.kind}
              </Chip>
              <span className="flex-1">
                <span className="font-mono text-[11px] text-ink-1">{r.id}</span>
                <span className="block text-[10px] text-ink-3">{r.reason}</span>
              </span>
            </li>
          ))}
          {!reviewers.length && (
            <li className="text-[11px] text-ink-3">No reviewers — files are unowned.</li>
          )}
        </ul>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] text-ink-3">CODEOWNERS source</summary>
        <textarea
          value={rawCodeowners}
          onChange={(e) => setRawCodeowners(e.target.value)}
          className="mt-1 h-32 w-full resize-y rounded-md border border-line/60 bg-bg px-2 py-1 font-mono text-[10px] text-ink-1 focus:border-accent focus:outline-none"
        />
      </details>
    </section>
  );
}
