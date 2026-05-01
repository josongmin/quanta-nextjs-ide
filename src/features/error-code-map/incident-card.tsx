import { useState } from 'react';
import { Chip, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { EnrichedFrame } from './enricher';
import type { Incident } from './store';

interface Props {
  incident: Incident;
  frames: ReadonlyArray<EnrichedFrame>;
  onJump(file: string, line: number): void;
  onRemove(id: string): void;
}

const friendlyTime = (ms: number): string => {
  const dt = new Date(ms);
  return dt.toLocaleTimeString([], { hour12: false });
};

const shortFile = (f: string): string => {
  const segs = f.split('/');
  if (segs.length <= 3) return f;
  return '…/' + segs.slice(-3).join('/');
};

export function IncidentCard({ incident, frames, onJump, onRemove }: Props) {
  const [open, setOpen] = useState(true);
  const appFrames = frames.filter((f) => !f.synthetic);
  const firstApp = appFrames[0];
  const projectCount = appFrames.length;
  const totalCount = frames.length;

  return (
    <div className="hairline-b last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-bg-hover"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon.ChevRight
          className={cn(
            'h-3 w-3 shrink-0 text-ink-3 transition-transform',
            open && 'rotate-90',
          )}
        />
        <span className="flex-1 truncate text-[12px] font-medium text-ink-1">
          {incident.parsed.errorName ? (
            <span className="text-sev-err">{incident.parsed.errorName}: </span>
          ) : null}
          {incident.parsed.message || '(no message)'}
        </span>
        <span className="shrink-0 text-[10px] font-mono text-ink-3">
          {projectCount}/{totalCount} frames
        </span>
        <span className="shrink-0 text-[10px] text-ink-3">
          {friendlyTime(incident.pastedAt)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(incident.id);
          }}
          className="ml-1 rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-sev-err"
          aria-label="dismiss"
        >
          <Icon.X className="h-3 w-3" />
        </button>
      </button>
      {open ? (
        <div className="border-t border-line bg-bg-subtle/40">
          {firstApp ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-ink-3 hairline-b">
              <span className="text-caps">first app frame</span>
              <span className="font-mono text-ink-1">
                {shortFile(firstApp.file)}:{firstApp.line}
              </span>
              {firstApp.routePath ? (
                <Chip tone="info" size="xs">
                  {firstApp.routePath}
                </Chip>
              ) : null}
              {firstApp.diagnosticIds.length > 0 ? (
                <Chip tone="warn" size="xs">
                  {firstApp.diagnosticIds.length} diag
                </Chip>
              ) : null}
              {firstApp.testFiles.length > 0 ? (
                <Chip tone="static" size="xs">
                  {firstApp.testFiles.length} tests
                </Chip>
              ) : null}
            </div>
          ) : null}
          <ul>
            {frames.map((f, i) => (
              <li key={i}>
                <button
                  type="button"
                  disabled={f.synthetic}
                  onClick={() => onJump(f.file, f.line)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1 text-left font-mono text-[11px]',
                    f.synthetic
                      ? 'text-ink-3'
                      : 'text-ink-1 hover:bg-bg-hover',
                  )}
                >
                  <span className="w-6 shrink-0 text-right text-[10px] text-ink-3">
                    {i}
                  </span>
                  <span
                    className={cn(
                      'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px]',
                      f.mapped
                        ? 'bg-sem-isr-soft text-sem-isr'
                        : f.synthetic
                          ? 'bg-bg-subtle text-ink-3'
                          : 'bg-sev-warn-soft text-sev-warn',
                    )}
                    title={
                      f.mapped
                        ? 'resolved via source-map'
                        : f.synthetic
                          ? 'synthetic frame'
                          : 'no source-map available'
                    }
                  >
                    {f.mapped ? '◆' : f.synthetic ? '·' : '◇'}
                  </span>
                  <span className="w-32 shrink-0 truncate text-ink-2">
                    {f.fn ?? f.symbol ?? '(anonymous)'}
                  </span>
                  <span className="flex-1 truncate">
                    {shortFile(f.file)}
                    <span className="text-ink-3">
                      :{f.line}
                      {f.column !== undefined ? `:${f.column}` : ''}
                    </span>
                  </span>
                  {f.routePath ? (
                    <span className="shrink-0 text-[10px] text-ink-3">
                      {f.routePath}
                    </span>
                  ) : null}
                  {f.diagnosticIds.length > 0 ? (
                    <span className="shrink-0 text-[10px] text-sev-warn">
                      {f.diagnosticIds.length}d
                    </span>
                  ) : null}
                  {f.testFiles.length > 0 ? (
                    <span className="shrink-0 text-[10px] text-sem-static">
                      {f.testFiles.length}t
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
