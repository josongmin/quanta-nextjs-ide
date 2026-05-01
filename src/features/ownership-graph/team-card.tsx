/**
 * Team card — initials avatar + label + member count.
 * Used in the team list pane and as compact reviewer chips.
 */

import { cn } from '@shared/lib/cn';
import type { TeamMeta } from './store';

interface Props {
  team: TeamMeta;
  fileCount?: number;
  highlight?: boolean;
  onClick?(): void;
}

function initials(label: string): string {
  const parts = label.replace(/[^a-zA-Z0-9 \-_/]/g, ' ').split(/[\s\-_/]+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) {
    const p = parts[0]!;
    return (p.slice(0, 2)).toUpperCase();
  }
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export function TeamCard({ team, fileCount, highlight, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors',
        highlight
          ? 'border-accent/60 bg-accent-soft'
          : 'border-line/60 hover:bg-bg-subtle',
      )}
    >
      <span
        aria-hidden
        className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: team.color }}
      >
        {initials(team.label)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold text-ink-1">{team.label}</span>
        <span className="block truncate text-[11px] text-ink-3">
          {team.id}
          {team.seniors.length ? ` · ${team.seniors.length} senior${team.seniors.length === 1 ? '' : 's'}` : ''}
        </span>
      </span>
      {typeof fileCount === 'number' && (
        <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[10px] tabular-nums text-ink-2">
          {fileCount}
        </span>
      )}
    </button>
  );
}
