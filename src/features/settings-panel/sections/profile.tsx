import { useUiStore, type InspectionProfile } from '@entities/ui-shell';
import { cn } from '@shared/lib/cn';

interface Option {
  id: InspectionProfile;
  title: string;
  description: string;
}

const OPTIONS: Option[] = [
  {
    id: 'startup',
    title: 'Startup MVP',
    description: 'Lenient — fewer warnings, faster ship.',
  },
  {
    id: 'commerce',
    title: 'Commerce',
    description: 'Strict on rendering / cache, lenient on auth.',
  },
  {
    id: 'dashboard',
    title: 'Dashboard SaaS',
    description: 'Strict on auth & role checks, normal cache.',
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'Strict everywhere — recommended for shared codebases.',
  },
  {
    id: 'taleban',
    title: 'Strict Taleban',
    description: 'Every soft warning escalated to ERR. Fix or mute.',
  },
  {
    id: 'custom',
    title: 'Custom',
    description: 'Per-rule severity, confidence, and autofix policy.',
  },
];

export function ProfileSection() {
  const profile = useUiStore((s) => s.profile);
  const setProfile = useUiStore((s) => s.setProfile);
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <h3 className="text-md font-semibold text-ink-1">Inspection profile</h3>
        <p className="text-xs text-ink-3">
          A single dial that biases severity, confidence thresholds, and autofix
          aggressiveness across all rules. Pick the closest preset; fine-tune via{' '}
          <span className="text-ink-2">Custom</span>.
        </p>
      </div>
      <div role="radiogroup" aria-label="Inspection profile" className="flex flex-col gap-1">
        {OPTIONS.map((o) => {
          const active = profile === o.id;
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
                name="profile"
                value={o.id}
                checked={active}
                onChange={() => setProfile(o.id)}
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
