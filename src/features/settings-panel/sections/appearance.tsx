import { useUiStore, type ColorMode } from '@entities/ui-shell';
import { cn } from '@shared/lib/cn';

interface ModeOption {
  id: ColorMode;
  title: string;
  description: string;
}

const OPTIONS: ModeOption[] = [
  {
    id: 'light',
    title: 'Light',
    description: 'Default — soft surfaces, hairlines, single accent.',
  },
  {
    id: 'light-hc',
    title: 'Light High Contrast',
    description: 'Stronger ink and borders for low-light or projection.',
  },
  {
    id: 'mac',
    title: 'Macintosh Edition',
    description: 'Platinum cream surfaces · Aqua accent · stippled desktop · traffic-light controls.',
  },
];

function PreviewTile({
  variant,
  active,
}: {
  variant: ColorMode;
  active: boolean;
}) {
  const isHc = variant === 'light-hc';
  const isMac = variant === 'mac';

  if (isMac) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-md border transition-colors',
          active ? 'border-[#9F968A]' : 'border-[#C9C0B0]',
        )}
        style={{
          backgroundColor: '#F5F0E6',
          backgroundImage:
            'radial-gradient(#DDD4C2 1px, transparent 1px), radial-gradient(#DDD4C2 1px, transparent 1px)',
          backgroundSize: '4px 4px, 4px 4px',
          backgroundPosition: '0 0, 2px 2px',
        }}
      >
        <div className="flex items-center gap-1 border-b border-[#C9C0B0] bg-gradient-to-b from-[#F5F0E6] to-[#ECE4D6] px-2 py-1">
          <span className="h-2 w-2 rounded-full border border-[#E0443E] bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full border border-[#DEA123] bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full border border-[#1AAB29] bg-[#28C840]" />
          <span className="ml-2 truncate text-[10px] font-semibold text-[#272421]">
            /products/[id]
          </span>
        </div>
        <div className="space-y-1 px-3 py-2">
          <div className="h-1.5 rounded-sm bg-[#9F968A]" style={{ width: '92%' }} />
          <div className="h-1.5 rounded-sm bg-[#C9C0B0]" style={{ width: '76%' }} />
          <div className="h-1.5 rounded-sm bg-[#DDD4C2]" style={{ width: '58%' }} />
        </div>
        <div className="flex items-center gap-1 px-3 pb-2 text-[10px] uppercase tracking-caps">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1F4FA8]" />
          <span className="text-[#1F4FA8]">ISR</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-sm border bg-white p-3 transition-colors',
        active ? 'border-accent' : 'border-line',
      )}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            isHc ? 'bg-black' : 'bg-ink-1',
          )}
        />
        <span
          className={cn(
            'text-xs',
            isHc ? 'text-black' : 'text-ink-2',
          )}
        >
          /products/[id]
        </span>
      </div>
      <div className="space-y-1">
        <div
          className={cn(
            'h-1.5 rounded-sm',
            isHc ? 'bg-zinc-900' : 'bg-line',
          )}
          style={{ width: '92%' }}
        />
        <div
          className={cn(
            'h-1.5 rounded-sm',
            isHc ? 'bg-zinc-700' : 'bg-line/70',
          )}
          style={{ width: '76%' }}
        />
        <div
          className={cn(
            'h-1.5 rounded-sm',
            isHc ? 'bg-zinc-500' : 'bg-line/50',
          )}
          style={{ width: '58%' }}
        />
      </div>
      <div className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-caps">
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            isHc ? 'bg-black' : 'bg-accent',
          )}
        />
        <span className={isHc ? 'text-black' : 'text-accent'}>ISR</span>
      </div>
    </div>
  );
}

export function AppearanceSection() {
  const colorMode = useUiStore((s) => s.colorMode);
  const setColorMode = useUiStore((s) => s.setColorMode);
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <h3 className="text-md font-semibold text-ink-1">Color mode</h3>
        <p className="text-xs text-ink-3">
          Light theme only in v1. Dark arrives with v2. High Contrast keeps the
          hairline aesthetic but cranks up ink and borders.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const active = colorMode === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setColorMode(o.id)}
              className={cn(
                'flex flex-col gap-2 rounded-sm border p-3 text-left transition-colors',
                active
                  ? 'border-accent bg-accent-soft/30'
                  : 'border-line bg-bg hover:bg-bg-hover',
              )}
              aria-pressed={active}
            >
              <PreviewTile variant={o.id} active={active} />
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
    </div>
  );
}
