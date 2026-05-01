export type RebaseAction =
  | 'pick'
  | 'reword'
  | 'edit'
  | 'squash'
  | 'fixup'
  | 'drop';

export type ConflictPrediction = 'none' | 'soft' | 'hard';

export interface RebaseCommit {
  id: string;
  sha: string;
  message: string;
  defaultAction: RebaseAction;
  conflict: ConflictPrediction;
}

export const REBASE_COMMITS: ReadonlyArray<RebaseCommit> = [
  {
    id: 'c1',
    sha: 'f1a02d3',
    message: 'feat(product): wire async params for Next 15',
    defaultAction: 'pick',
    conflict: 'soft',
  },
  {
    id: 'c2',
    sha: '49bd113',
    message: 'fixup! feat(product): wire async params for Next 15',
    defaultAction: 'fixup',
    conflict: 'none',
  },
  {
    id: 'c3',
    sha: '7e9c810',
    message: 'feat(cart): zod-validate addToCart',
    defaultAction: 'pick',
    conflict: 'none',
  },
  {
    id: 'c4',
    sha: '2bc0a40',
    message: 'wip: typo in cart action',
    defaultAction: 'squash',
    conflict: 'none',
  },
  {
    id: 'c5',
    sha: 'a90e7af',
    message: 'chore: bump deps',
    defaultAction: 'pick',
    conflict: 'hard',
  },
  {
    id: 'c6',
    sha: '5dd8214',
    message: 'docs: update README for cache strategy',
    defaultAction: 'reword',
    conflict: 'none',
  },
  {
    id: 'c7',
    sha: 'cb55a02',
    message: 'feat(gallery): client component conversion',
    defaultAction: 'pick',
    conflict: 'soft',
  },
  {
    id: 'c8',
    sha: '0a72e6d',
    message: 'tmp: console.log left over',
    defaultAction: 'drop',
    conflict: 'none',
  },
];

export const ACTION_LABEL: Record<RebaseAction, string> = {
  pick: 'pick',
  reword: 'reword',
  edit: 'edit',
  squash: 'squash',
  fixup: 'fixup',
  drop: 'drop',
};

export const ACTION_TONE: Record<
  RebaseAction,
  'static' | 'info' | 'warn' | 'muted' | 'err' | 'accent'
> = {
  pick: 'static',
  reword: 'info',
  edit: 'warn',
  squash: 'accent',
  fixup: 'muted',
  drop: 'err',
};

export const CONFLICT_TONE: Record<ConflictPrediction, 'muted' | 'info' | 'err'> = {
  none: 'muted',
  soft: 'info',
  hard: 'err',
};

export const CONFLICT_LABEL: Record<ConflictPrediction, string> = {
  none: 'no conflict',
  soft: 'soft conflict',
  hard: 'hard conflict',
};

export interface ProjectedCommit {
  sha: string;
  message: string;
  action: RebaseAction;
  conflict: ConflictPrediction;
  nested: boolean;
}

/**
 * Project the rebase plan to a final commit log. `squash` and `fixup` rows
 * collapse into the previous non-collapsed commit; `drop` is removed.
 */
export function projectRebase(
  commits: ReadonlyArray<RebaseCommit>,
  actions: Record<string, RebaseAction>,
  messages: Record<string, string>,
): ReadonlyArray<ProjectedCommit> {
  const out: ProjectedCommit[] = [];
  for (const c of commits) {
    const action = actions[c.id] ?? c.defaultAction;
    if (action === 'drop') continue;
    if (action === 'squash' || action === 'fixup') {
      const prev = out[out.length - 1];
      if (prev) {
        prev.message =
          action === 'fixup'
            ? prev.message
            : `${prev.message}\n  + ${messages[c.id] ?? c.message}`;
        out.push({
          sha: c.sha,
          message: messages[c.id] ?? c.message,
          action,
          conflict: c.conflict,
          nested: true,
        });
        continue;
      }
    }
    out.push({
      sha: c.sha,
      message: messages[c.id] ?? c.message,
      action,
      conflict: c.conflict,
      nested: false,
    });
  }
  return out;
}
