import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { EDGES, MODULES, type Bundler, type ModuleNode } from '../helpers';

interface DiffRow {
  m: ModuleNode;
  tk: number;
  wk: number;
  delta: number;
}

interface FooterBarProps {
  bundler: Bundler;
  totalT: number;
  totalW: number;
  diffRows: ReadonlyArray<DiffRow>;
  onClose(): void;
}

export function FooterBar({ bundler, totalT, totalW, diffRows, onClose }: FooterBarProps) {
  return (
    <div className="flex w-full items-center justify-between text-xs">
      <div className="flex items-center gap-3 text-ink-3">
        <span>
          <span className="text-ink-2">modules:</span>{' '}
          <span className="font-mono text-ink-1">{MODULES.length}</span>
        </span>
        <span>
          <span className="text-ink-2">total:</span>{' '}
          <span className="font-mono text-ink-1">
            {bundler === 'turbopack' ? totalT : totalW}KB
          </span>
        </span>
        <span>
          <span className="text-ink-2">edges:</span>{' '}
          <span className="font-mono text-ink-1">{EDGES.length}</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="xs" tone="default">
              Compare bundlers
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-3">
            <div className="mb-2 text-[11px] uppercase tracking-caps text-ink-3">
              Top size diffs (Webpack − Turbopack)
            </div>
            <ul className="space-y-1 text-[11px]">
              {diffRows.map((r) => (
                <li key={r.m.id} className="flex items-center gap-2">
                  <span className="flex-1 truncate font-mono text-ink-2">
                    {r.m.name}
                  </span>
                  <span className="font-mono text-ink-3">{r.tk}</span>
                  <span className="text-ink-3">→</span>
                  <span className="font-mono text-ink-3">{r.wk}</span>
                  <span
                    className={cn(
                      'font-mono w-12 text-right',
                      r.delta > 0 ? 'text-sev-err' : 'text-sem-static',
                    )}
                  >
                    {r.delta > 0 ? '+' : ''}
                    {r.delta}KB
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 hairline-t pt-2 text-[10px] text-ink-3">
              Turbopack total {totalT}KB · Webpack total {totalW}KB · saving{' '}
              {totalW - totalT}KB
            </div>
          </PopoverContent>
        </Popover>
        <Button size="xs" tone="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
