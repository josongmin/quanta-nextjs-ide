// Inline git blame overlay element. Rendered for the cursor's line by the
// editor's inline-blame layer. Visual style follows VS Code GitLens —
// italic ghost text positioned at the end of the active line.
import type { BlameEntry } from './helpers';
import { formatAge } from './helpers';

export type { BlameEntry } from './helpers';
export { mockBlame, blameForLine, formatAge } from './helpers';

interface InlineBlameProps {
  entry: BlameEntry;
}

export function InlineBlame({ entry }: InlineBlameProps) {
  const age = formatAge(entry.ageDays);
  return (
    <span
      className="pointer-events-none select-none whitespace-nowrap font-mono italic text-ink-3"
      style={{ fontSize: 11, opacity: 0.75 }}
    >
      <span className="text-ink-2">{entry.author}</span>
      <span className="mx-1 text-ink-3">·</span>
      <span>{age}</span>
      <span className="mx-1 text-ink-3">·</span>
      <span className="text-ink-3">&ldquo;{entry.subject}&rdquo;</span>
      <span className="ml-1.5 text-ink-3/60">{entry.sha}</span>
    </span>
  );
}
