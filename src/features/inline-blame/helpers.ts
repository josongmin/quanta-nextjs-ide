// Helpers for the inline blame ghost-row.
// Re-exports the canonical mock blame so consumers don't need to know the
// underlying data source path.

import { mockBlame, blameForLine } from '@shared/mocks/git-blame';

export type { BlameEntry } from '@shared/mocks/git-blame';
export { mockBlame, blameForLine };

export function formatAge(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d`;
  if (days < 30) {
    const w = Math.round(days / 7);
    return `${w}w`;
  }
  if (days < 365) {
    const m = Math.round(days / 30);
    return `${m}mo`;
  }
  const y = Math.round(days / 365);
  return `${y}y`;
}
