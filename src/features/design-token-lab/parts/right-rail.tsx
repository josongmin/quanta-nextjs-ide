import { Chip, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  CONTRAST_PAIRS,
  TOKEN_USAGE,
  colorByName,
  contrast,
  type TokenSet,
} from '../helpers';

interface RightRailProps {
  tokens: TokenSet;
}

export function RightRail({ tokens }: RightRailProps): JSX.Element {
  const c = (n: string) => colorByName(tokens, n);
  return (
    <aside className="min-w-0">
      <ScrollArea className="max-h-[68vh]">
        <div className="px-3 py-3">
          <h4 className="text-caps text-ink-3">Contrast (WCAG AA)</h4>
          <ul className="mt-1 space-y-1">
            {CONTRAST_PAIRS.map((p) => {
              const fgHex = c(p.fg);
              const bgHex = c(p.bg);
              const ratio = contrast(fgHex, bgHex);
              const passes = ratio >= 4.5;
              return (
                <li
                  key={`${p.fg}-${p.bg}`}
                  className="flex items-center gap-1.5 rounded-sm border border-line bg-bg p-1.5 text-[11px]"
                >
                  <span
                    className="h-5 w-9 rounded-sm border border-line text-center"
                    style={{ background: bgHex, color: fgHex, lineHeight: '20px' }}
                  >
                    Aa
                  </span>
                  <span className="flex-1 truncate text-ink-2">{p.label}</span>
                  <span className="font-mono text-ink-1">{ratio}</span>
                  <Chip tone={passes ? 'info' : 'err'} size="xs">
                    {passes ? 'AA' : 'fail'}
                  </Chip>
                </li>
              );
            })}
          </ul>

          <h4 className="text-caps mt-3 text-ink-3">Token usage</h4>
          <ul className="mt-1 space-y-0.5 text-[11px] text-ink-2">
            {Object.entries(TOKEN_USAGE).map(([name, count]) => (
              <li key={name} className="flex items-center justify-between">
                <span className={cn('font-mono')}>{name}</span>
                <span className="font-mono text-ink-1">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>
    </aside>
  );
}
