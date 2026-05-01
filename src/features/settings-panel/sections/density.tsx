import { useUiStore, type Density } from '@entities/ui-shell';
import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface Option {
  id: Density;
  title: string;
  description: string;
}

const OPTIONS: Option[] = [
  {
    id: 'minimal',
    title: 'Minimal',
    description: 'Inline lens off · gutter mark only · ghost annotation hidden.',
  },
  {
    id: 'default',
    title: 'Default',
    description: 'Route/action lenses · core ghost annotation only.',
  },
  {
    id: 'rich',
    title: 'Rich',
    description: 'All inlay hints + every ghost annotation.',
  },
];

function DensityPreview({ density }: { density: Density }) {
  const showInlineLens = density !== 'minimal';
  const showGhost = density === 'rich' || density === 'default';
  const showAllGhosts = density === 'rich';

  return (
    <div className="rounded-sm border border-line bg-bg p-3 font-mono text-[11px] leading-5 text-ink-1">
      {showInlineLens ? (
        <div className="mb-1 flex items-center gap-1.5 text-[10px] tracking-caps text-ink-3">
          <Chip tone="dynamic" size="xs">DYN</Chip>
          <span>cause: cookies()@layout.tsx:8</span>
        </div>
      ) : (
        <div className="mb-1 h-3" aria-hidden />
      )}
      <div className="flex items-baseline gap-2">
        <span className="text-ink-3">12</span>
        <span>
          <span className="text-purple-700">const</span>{' '}
          <span className="text-ink-1">data</span>{' '}
          <span className="text-ink-3">=</span>{' '}
          <span className="text-purple-700">await</span>{' '}
          <span className="text-blue-700">fetch</span>
          <span className="text-ink-3">(</span>
          <span className="text-emerald-700">'/api/products'</span>
          <span className="text-ink-3">)</span>
        </span>
        {showGhost ? (
          <span className="ml-2 italic text-ink-3">
            → default cache · ⚠ stale risk?
          </span>
        ) : null}
      </div>
      {showAllGhosts ? (
        <div className="ml-7 italic text-ink-3">
          → tag: products · revalidate: ∅ · 14 routes affected
        </div>
      ) : null}
    </div>
  );
}

export function DensitySection() {
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <h3 className="text-md font-semibold text-ink-1">Density</h3>
        <p className="text-xs text-ink-3">
          Controls how loud the inline lens and ghost annotations are inside the
          editor. The right column previews the change live.
        </p>
      </div>
      <div className="grid grid-cols-[1fr_1.4fr] gap-4">
        <div className="flex flex-col gap-2">
          {OPTIONS.map((o) => {
            const active = density === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setDensity(o.id)}
                className={cn(
                  'rounded-sm border px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-accent bg-accent-soft/30'
                    : 'border-line bg-bg hover:bg-bg-hover',
                )}
                aria-pressed={active}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-1">{o.title}</span>
                  {active ? (
                    <span className="text-[10px] uppercase tracking-caps text-accent">
                      selected
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-ink-3">{o.description}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">
            Live preview
          </span>
          <DensityPreview density={density} />
        </div>
      </div>
    </div>
  );
}
