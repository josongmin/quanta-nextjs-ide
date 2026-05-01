import { Chip, ScrollArea } from '@shared/ui';
import {
  INITIAL_TOKENS,
  colorByName,
  type TokenSet,
} from '../helpers';

interface TokenTreeProps {
  tokens: TokenSet;
  setColor: (i: number, value: string) => void;
  setSpacing: (i: number, px: number) => void;
  setRadius: (i: number, px: number) => void;
  setType: (
    i: number,
    patch: Partial<{ fontSize: number; lineHeight: number; weight: number }>,
  ) => void;
}

export function TokenTree({
  tokens,
  setColor,
  setSpacing,
  setRadius,
  setType,
}: TokenTreeProps): JSX.Element {
  const c = (n: string) => colorByName(tokens, n);
  return (
    <aside className="min-w-0">
      <ScrollArea className="max-h-[68vh]">
        <div className="px-3 py-3">
          <h4 className="text-caps text-ink-3">Color</h4>
          <ul className="mt-1 space-y-1">
            {tokens.colors.map((col, i) => {
              const orig = INITIAL_TOKENS.colors[i];
              const changed = orig?.value !== col.value;
              return (
                <li key={col.name} className="flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded-sm border border-line"
                    style={{ background: col.value }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate font-mono text-[11px] text-ink-1">
                    {col.name}
                  </span>
                  <input
                    type="text"
                    value={col.value}
                    onChange={(e) => setColor(i, e.target.value)}
                    className="h-5 w-20 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] text-ink-1"
                  />
                  {changed && (
                    <Chip tone="accent" size="xs">
                      Δ
                    </Chip>
                  )}
                </li>
              );
            })}
          </ul>

          <h4 className="text-caps mt-3 text-ink-3">Spacing</h4>
          <ul className="mt-1 space-y-1">
            {tokens.spacing.map((sp, i) => {
              const orig = INITIAL_TOKENS.spacing[i];
              const changed = orig?.px !== sp.px;
              return (
                <li key={sp.name} className="flex items-center gap-2">
                  <span className="flex-1 truncate font-mono text-[11px] text-ink-1">
                    {sp.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={sp.px}
                    onChange={(e) => setSpacing(i, Number(e.target.value) || 0)}
                    className="h-5 w-16 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] text-ink-1"
                  />
                  <span className="text-[10px] text-ink-3">px</span>
                  {changed && (
                    <Chip tone="accent" size="xs">
                      Δ
                    </Chip>
                  )}
                </li>
              );
            })}
          </ul>

          <h4 className="text-caps mt-3 text-ink-3">Radius</h4>
          <ul className="mt-1 space-y-1">
            {tokens.radius.map((rd, i) => {
              const orig = INITIAL_TOKENS.radius[i];
              const changed = orig?.px !== rd.px;
              return (
                <li key={rd.name} className="flex items-center gap-2">
                  <span
                    className="h-4 w-6 border border-line"
                    style={{ borderRadius: rd.px, background: c('bg-subtle') }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate font-mono text-[11px] text-ink-1">
                    {rd.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={rd.px}
                    onChange={(e) => setRadius(i, Number(e.target.value) || 0)}
                    className="h-5 w-16 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] text-ink-1"
                  />
                  {changed && (
                    <Chip tone="accent" size="xs">
                      Δ
                    </Chip>
                  )}
                </li>
              );
            })}
          </ul>

          <h4 className="text-caps mt-3 text-ink-3">Type</h4>
          <ul className="mt-1 space-y-1">
            {tokens.type.map((tp, i) => {
              const orig = INITIAL_TOKENS.type[i];
              const changed =
                !orig ||
                orig.fontSize !== tp.fontSize ||
                orig.lineHeight !== tp.lineHeight ||
                orig.weight !== tp.weight;
              return (
                <li key={tp.name} className="flex items-center gap-1.5">
                  <span className="w-10 truncate font-mono text-[11px] text-ink-1">
                    {tp.name}
                  </span>
                  <input
                    type="number"
                    value={tp.fontSize}
                    onChange={(e) =>
                      setType(i, { fontSize: Number(e.target.value) || 0 })
                    }
                    className="h-5 w-12 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] text-ink-1"
                  />
                  <span className="text-[9px] text-ink-3">/</span>
                  <input
                    type="number"
                    value={tp.lineHeight}
                    onChange={(e) =>
                      setType(i, { lineHeight: Number(e.target.value) || 0 })
                    }
                    className="h-5 w-12 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] text-ink-1"
                  />
                  <input
                    type="number"
                    value={tp.weight}
                    step={100}
                    onChange={(e) =>
                      setType(i, { weight: Number(e.target.value) || 0 })
                    }
                    className="h-5 w-12 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] text-ink-1"
                  />
                  {changed && (
                    <Chip tone="accent" size="xs">
                      Δ
                    </Chip>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollArea>
    </aside>
  );
}
