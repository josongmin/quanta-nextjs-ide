import { useMemo } from 'react';
import { useDiagnosticStore } from '@entities/diagnostic';
import { Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface Props {
  file: string;
  className?: string;
}

interface Counts {
  err: number;
  warn: number;
  info: number;
  hint: number;
}

/**
 * Small severity badge to render inside an editor tab.
 * - red dot + count for errors,
 * - amber dot + count for warnings,
 * - small gray hash for hints,
 * - nothing if the file is clean.
 */
export function EditorTabBadge({ file, className }: Props) {
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);

  const counts = useMemo<Counts>(() => {
    const out: Counts = { err: 0, warn: 0, info: 0, hint: 0 };
    for (const d of diagnostics) {
      if (d.location.file !== file) continue;
      out[d.severity] += 1;
    }
    return out;
  }, [diagnostics, file]);

  const total = counts.err + counts.warn + counts.info + counts.hint;
  if (total === 0) return null;

  const tooltip = (
    <div className="flex flex-col gap-0.5 text-[11px] leading-none">
      <span className="font-medium text-ink-1">Diagnostics</span>
      {counts.err > 0 && <span className="text-sev-err">err  {counts.err}</span>}
      {counts.warn > 0 && <span className="text-sev-warn">warn {counts.warn}</span>}
      {counts.info > 0 && <span className="text-sev-info">info {counts.info}</span>}
      {counts.hint > 0 && <span className="text-ink-3">hint {counts.hint}</span>}
    </div>
  );

  let badge: React.ReactNode = null;
  if (counts.err > 0) {
    badge = (
      <span className="inline-flex items-center gap-1 text-[10px] tabular-nums text-sev-err">
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-sev-err" />
        {counts.err}
      </span>
    );
  } else if (counts.warn > 0) {
    badge = (
      <span className="inline-flex items-center gap-1 text-[10px] tabular-nums text-sev-warn">
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-sev-warn" />
        {counts.warn}
      </span>
    );
  } else if (counts.hint > 0 || counts.info > 0) {
    badge = (
      <span className="text-[10px] text-ink-3 tabular-nums">
        #{counts.hint + counts.info}
      </span>
    );
  }

  if (!badge) return null;

  return (
    <Tooltip content={tooltip} side="bottom">
      <span
        aria-label={`Diagnostics: ${counts.err} err, ${counts.warn} warn, ${counts.info} info, ${counts.hint} hint`}
        className={cn('inline-flex items-center', className)}
      >
        {badge}
      </span>
    </Tooltip>
  );
}
