import { toast } from 'sonner';
import { Button, Chip, ScrollArea } from '@shared/ui';
import {
  TOTAL_MS,
  depthOf,
  topChildrenByTotal,
  type FlameFrame,
} from '../helpers';
import { kindTone } from './styles';

interface SelectedFramePanelProps {
  selected: FlameFrame;
  onPick: (id: string) => void;
}

export function SelectedFramePanel({
  selected,
  onPick,
}: SelectedFramePanelProps) {
  return (
    <div className="rounded-sm border border-line bg-bg">
      <div className="flex h-7 items-center hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
        selected frame
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-1.5">
          <Chip tone={kindTone(selected.kind)} size="xs">
            {selected.kind}
          </Chip>
          <span className="truncate font-mono text-xs text-ink-1">
            {selected.name}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-y-0.5 text-[11px]">
          <dt className="text-ink-3">selfMs</dt>
          <dd className="font-mono text-ink-1">{selected.selfMs.toFixed(2)}</dd>
          <dt className="text-ink-3">totalMs</dt>
          <dd className="font-mono text-ink-1">
            {selected.totalMs.toFixed(2)}
          </dd>
          <dt className="text-ink-3">% of capture</dt>
          <dd className="font-mono text-ink-1">
            {((selected.totalMs / TOTAL_MS) * 100).toFixed(1)}%
          </dd>
          <dt className="text-ink-3">depth</dt>
          <dd className="font-mono text-ink-1">{depthOf(selected.id)}</dd>
        </dl>
        <div className="flex items-center gap-1.5 pt-1">
          <Button
            size="xs"
            tone="default"
            onClick={() => toast(`Find “${selected.name}” in source (mock)`)}
          >
            Find in source
          </Button>
          <Button
            size="xs"
            tone="warn"
            onClick={() => toast(`${selected.name} marked hot (mock)`)}
          >
            Mark hot
          </Button>
        </div>
      </div>
      <div className="hairline-t">
        <div className="flex h-6 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3">
          top children
        </div>
        <ScrollArea className="max-h-56">
          <ul className="px-2 pb-2">
            {topChildrenByTotal(selected.id, 5).map((c) => {
              const pct = selected.totalMs
                ? (c.totalMs / selected.totalMs) * 100
                : 0;
              return (
                <li
                  key={c.id}
                  className="grid cursor-pointer items-center gap-2 rounded-sm px-1 py-1 hover:bg-bg-hover"
                  style={{ gridTemplateColumns: '14px 1fr 56px' }}
                  onClick={() => onPick(c.id)}
                >
                  <Chip tone={kindTone(c.kind)} size="xs">
                    {' '}
                  </Chip>
                  <span className="truncate font-mono text-[11px] text-ink-1">
                    {c.name}
                  </span>
                  <span className="font-mono text-[10px] text-ink-3">
                    {pct.toFixed(0)}%
                  </span>
                </li>
              );
            })}
            {topChildrenByTotal(selected.id, 5).length === 0 && (
              <li className="px-1 py-2 text-[11px] text-ink-3">
                Leaf frame · no children.
              </li>
            )}
          </ul>
        </ScrollArea>
      </div>
    </div>
  );
}
