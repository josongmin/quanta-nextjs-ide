import { Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { ConflictRegion, MergeFile } from '../helpers';

export type SideTone = 'local' | 'base' | 'incoming';

const HEAD_TONES: Record<SideTone, string> = {
  local: 'bg-accent-soft text-accent',
  base: 'bg-bg-subtle text-ink-2',
  incoming: 'bg-sev-warn-soft text-sev-warn',
};

const REGION_TONES: Record<SideTone, string> = {
  local: 'bg-accent-soft/60',
  base: 'bg-bg-subtle/60',
  incoming: 'bg-sev-warn-soft/60',
};

interface SidePaneProps {
  title: string;
  tone: SideTone;
  file: MergeFile;
  regions: ReadonlyArray<ConflictRegion>;
  onKeep?: (regionId: string) => void;
  activeRegionId: string | null;
  registerRow?: (regionId: string, el: HTMLDivElement | null) => void;
}

export function SidePane({
  title,
  tone,
  file,
  regions,
  onKeep,
  activeRegionId,
  registerRow,
}: SidePaneProps) {
  const sideKey = tone;

  return (
    <div className="flex min-w-0 flex-col rounded-sm border border-line bg-bg">
      <header
        className={cn(
          'flex items-center gap-2 px-2 py-1 hairline-b text-caps',
          HEAD_TONES[tone],
        )}
      >
        <span>{title}</span>
        <span className="ml-auto font-mono text-[10px] text-ink-3">
          {regions.length} region{regions.length === 1 ? '' : 's'}
        </span>
      </header>
      <div className="max-h-[52vh] overflow-auto font-mono text-[11px] leading-[16px]">
        {file.preamble.map((line, i) => (
          <div key={`pre-${i}`} className="flex whitespace-pre px-2 text-ink-1">
            <span className="w-7 select-none pr-2 text-right text-ink-3">
              {i + 1}
            </span>
            <span>{line || ' '}</span>
          </div>
        ))}
        {regions.map((region) => {
          const lines =
            sideKey === 'local'
              ? region.local
              : sideKey === 'base'
                ? region.base
                : region.incoming;
          const isActive = activeRegionId === region.id;
          return (
            <div
              key={region.id}
              ref={(el) => registerRow?.(region.id, el)}
              className={cn(
                'border-y border-line/60 px-0 py-0.5',
                REGION_TONES[tone],
                isActive && 'ring-1 ring-inset ring-accent/40',
              )}
            >
              <div className="flex items-center justify-between px-2 py-0.5 text-[10px] text-ink-3">
                <span>region {region.id}</span>
                {onKeep ? (
                  <button
                    type="button"
                    onClick={() => onKeep(region.id)}
                    className="inline-flex items-center gap-1 rounded-sm border border-line bg-bg px-1.5 py-[1px] text-[10px] text-ink-1 hover:bg-bg-hover"
                  >
                    <Icon.Down className="h-3 w-3" /> keep
                  </button>
                ) : null}
              </div>
              {lines.map((line, i) => (
                <div
                  key={`${region.id}-${i}`}
                  className="flex whitespace-pre px-2 text-ink-1"
                >
                  <span className="w-7 select-none pr-2 text-right text-ink-3">
                    {region.startLine + i}
                  </span>
                  <span>{line || ' '}</span>
                </div>
              ))}
            </div>
          );
        })}
        {file.postamble.map((line, i) => (
          <div key={`post-${i}`} className="flex whitespace-pre px-2 text-ink-1">
            <span className="w-7 select-none pr-2 text-right text-ink-3">
              {file.preamble.length + regions.length + i + 1}
            </span>
            <span>{line || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
