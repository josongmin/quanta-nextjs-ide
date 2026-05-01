import { useUiStore, type AutofixPolicy } from '@entities/ui-shell';
import { cn } from '@shared/lib/cn';

interface Option {
  id: AutofixPolicy;
  title: string;
  description: string;
}

const OPTIONS: Option[] = [
  {
    id: 'off',
    title: 'Off',
    description: 'NSS will never apply fixes. Diagnostics still surface.',
  },
  {
    id: 'suggest',
    title: 'Suggest',
    description:
      'Fixes appear as Quick Fix actions and previews — applied only when you confirm.',
  },
  {
    id: 'on-save',
    title: 'On save',
    description:
      'Fixes flagged "safe" auto-apply when you save the file. Risky fixes still ask.',
  },
];

export function AutofixSection() {
  const autofixPolicy = useUiStore((s) => s.autofixPolicy);
  const setAutofixPolicy = useUiStore((s) => s.setAutofixPolicy);
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <h3 className="text-md font-semibold text-ink-1">Autofix</h3>
        <p className="text-xs text-ink-3">
          When NSS is allowed to apply fixes automatically. The detective never
          rewrites your code without permission unless you opt in.
        </p>
      </div>
      <div role="radiogroup" aria-label="Autofix policy" className="flex flex-col gap-1">
        {OPTIONS.map((o) => {
          const active = autofixPolicy === o.id;
          return (
            <label
              key={o.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-2 transition-colors',
                active
                  ? 'border-accent bg-accent-soft/30'
                  : 'border-line bg-bg hover:bg-bg-hover',
              )}
            >
              <input
                type="radio"
                name="autofix"
                value={o.id}
                checked={active}
                onChange={() => setAutofixPolicy(o.id)}
                className="mt-1 h-3 w-3 accent-[hsl(var(--accent))]"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink-1">{o.title}</div>
                <div className="text-xs text-ink-3">{o.description}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
