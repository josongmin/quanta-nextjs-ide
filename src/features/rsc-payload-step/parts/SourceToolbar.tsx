import type { SourceKind } from '@shared/rsc-sources';
import { Button, Icon } from '@shared/ui';
import type { AutoRefetchMode } from '../model/useAutoRefetch';

interface SourceToolbarProps {
  sourceKind: SourceKind;
  pendingUrl: string;
  onPendingUrlChange: (v: string) => void;
  onFetch: () => void;
  onSourceToggle: (next: SourceKind) => void;
  error: Error | null;
  autoMode: AutoRefetchMode;
  onAutoModeChange: (m: AutoRefetchMode) => void;
}

export function SourceToolbar({
  sourceKind,
  pendingUrl,
  onPendingUrlChange,
  onFetch,
  onSourceToggle,
  error,
  autoMode,
  onAutoModeChange,
}: SourceToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
      <div className="flex items-center gap-1 rounded border border-line-1 p-0.5">
        <Button
          size="xs"
          tone={sourceKind === 'mock' ? 'accent' : 'ghost'}
          onClick={() => onSourceToggle('mock')}
        >
          Mock
        </Button>
        <Button
          size="xs"
          tone={sourceKind === 'fetch' ? 'accent' : 'ghost'}
          onClick={() => onSourceToggle('fetch')}
        >
          Live
        </Button>
      </div>

      <input
        type="text"
        value={pendingUrl}
        onChange={(e) => onPendingUrlChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onFetch();
        }}
        placeholder="/__rsc/products/walnut-table"
        spellCheck={false}
        className="h-7 min-w-[280px] flex-1 rounded border border-line-1 bg-bg-1 px-2 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
      />
      <Button size="xs" tone="accent" onClick={onFetch}>
        <Icon.Refresh className="h-3 w-3" />
        Fetch
      </Button>
      {error ? (
        <span className="font-mono text-[10px] text-edge" title={error.message}>
          {error.message.length > 60
            ? `${error.message.slice(0, 60)}…`
            : error.message}
        </span>
      ) : null}

      <div className="ml-auto flex items-center gap-1 rounded border border-line-1 p-0.5">
        <span className="px-1 text-[10px] uppercase tracking-wide text-ink-3">
          auto
        </span>
        <Button
          size="xs"
          tone={autoMode === 'off' ? 'accent' : 'ghost'}
          onClick={() => onAutoModeChange('off')}
        >
          Off
        </Button>
        <Button
          size="xs"
          tone={autoMode === 'focus' ? 'accent' : 'ghost'}
          onClick={() => onAutoModeChange('focus')}
          disabled={sourceKind !== 'fetch'}
        >
          Focus
        </Button>
        <Button
          size="xs"
          tone={autoMode === 'interval' ? 'accent' : 'ghost'}
          onClick={() => onAutoModeChange('interval')}
          disabled={sourceKind !== 'fetch'}
        >
          5s
        </Button>
      </div>
    </div>
  );
}
