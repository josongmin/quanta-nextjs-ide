import { Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  CACHE_OPTS,
  LOCALE_OPTS,
  RUNTIME_OPTS,
  type CacheMode,
  type Locale,
  type Runtime,
} from '../helpers';

interface OptionsRailProps {
  runtime: Runtime;
  onRuntimeChange(r: Runtime): void;
  cache: CacheMode;
  onCacheChange(c: CacheMode): void;
  auth: boolean;
  onAuthToggle(): void;
  locale: Locale;
  onLocaleChange(l: Locale): void;
}

function RailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-ink-3">{label}</span>
      {children}
    </div>
  );
}

export function OptionsRail({
  runtime,
  onRuntimeChange,
  cache,
  onCacheChange,
  auth,
  onAuthToggle,
  locale,
  onLocaleChange,
}: OptionsRailProps) {
  return (
    <div className="p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <Icon.Settings className="h-3.5 w-3.5 text-ink-3" />
        <span className="text-caps text-ink-3">Options</span>
      </div>

      <div className="space-y-3">
        <RailRow label="Runtime">
          <select
            value={runtime}
            onChange={(e) => onRuntimeChange(e.target.value as Runtime)}
            className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
          >
            {RUNTIME_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </RailRow>

        <RailRow label="Cache">
          <select
            value={cache}
            onChange={(e) => onCacheChange(e.target.value as CacheMode)}
            className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
          >
            {CACHE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </RailRow>

        <RailRow label="Auth">
          <button
            onClick={onAuthToggle}
            aria-pressed={auth}
            className={cn(
              'rounded-sm border px-1.5 py-0.5 text-[11px]',
              auth
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {auth ? 'required' : 'public'}
          </button>
        </RailRow>

        <RailRow label="Locale">
          <select
            value={locale}
            onChange={(e) => onLocaleChange(e.target.value as Locale)}
            className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
          >
            {LOCALE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </RailRow>
      </div>

      <div className="mt-4 rounded-sm border border-dashed border-line bg-bg-subtle/40 p-2 text-[11px] leading-4 text-ink-3">
        Options influence the scaffold but are illustrative in this mock.
      </div>
    </div>
  );
}
