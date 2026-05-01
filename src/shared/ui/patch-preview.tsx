import type { QuickFix } from '@shared/types';
import { Button } from './button';
import { cn } from '@shared/lib/cn';

interface Props {
  fix: QuickFix;
  onApply?(): void;
  onApplyAll?(): void;
  onCancel?(): void;
  className?: string;
}

export function PatchPreview({ fix, onApply, onApplyAll, onCancel, className }: Props) {
  return (
    <div
      role="dialog"
      aria-label={`Patch preview: ${fix.title}`}
      className={cn(
        'w-[440px] rounded-md border border-line bg-bg shadow-pop',
        'animate-in fade-in-0 zoom-in-[0.98] duration-150 ease-out',
        className,
      )}
    >
      <header className="px-3 py-2 hairline-b">
        <div className="text-sm font-medium text-ink-1">Apply: {fix.title}</div>
        {fix.description ? (
          <div className="mt-0.5 text-[11px] text-ink-3">{fix.description}</div>
        ) : null}
      </header>

      {fix.preview && (
        <>
          <div className="hairline-b">
            <div className="grid grid-cols-1 divide-y divide-line">
              <pre className="overflow-x-auto px-3 py-2 font-mono text-[11px] text-sev-err bg-sev-err-soft/40">
                {fix.preview.before
                  .split('\n')
                  .map((l) => `- ${l}`)
                  .join('\n')}
              </pre>
              <pre className="overflow-x-auto px-3 py-2 font-mono text-[11px] text-sem-static bg-bg-subtle">
                {fix.preview.after
                  .split('\n')
                  .map((l) => `+ ${l}`)
                  .join('\n')}
              </pre>
            </div>
          </div>
          {fix.preview.behaviorDiff.length > 0 && (
            <div className="px-3 py-2 hairline-b">
              <div className="mb-1.5 text-caps text-ink-3">Behavior change</div>
              <table className="w-full font-mono text-[11px]">
                <tbody>
                  {fix.preview.behaviorDiff.map((row) => (
                    <tr key={row.field}>
                      <td className="w-24 py-0.5 text-ink-3">{row.field}</td>
                      <td className="py-0.5 text-ink-2 line-through">{row.before}</td>
                      <td className="px-1 py-0.5 text-ink-3">→</td>
                      <td className="py-0.5 text-ink-1">{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <footer className="flex items-center justify-end gap-1.5 px-3 py-2 bg-bg-subtle">
        <Button size="xs" tone="ghost" onClick={onCancel}>
          Cancel
        </Button>
        {fix.applyToAll && (
          <Button size="xs" tone="default" onClick={onApplyAll}>
            Apply to all
          </Button>
        )}
        <Button size="xs" tone="accent" onClick={onApply}>
          Apply
        </Button>
      </footer>
    </div>
  );
}
