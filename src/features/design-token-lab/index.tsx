import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel } from '@shared/ui';
import {
  INITIAL_TOKENS,
  cloneTokens,
  diffCount,
  toCss,
  type TokenSet,
} from './helpers';
import { TokenTree } from './parts/token-tree';
import { PreviewPane } from './parts/preview-pane';
import { RightRail } from './parts/right-rail';

export function DesignTokenLabOverlay() {
  const open = useUiStore((s) => s.overlays.designTokenLab.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [tokens, setTokens] = useState<TokenSet>(() => cloneTokens(INITIAL_TOKENS));

  const diff = useMemo(() => diffCount(INITIAL_TOKENS, tokens), [tokens]);

  const setColor = (i: number, value: string) =>
    setTokens((prev) => {
      const next = cloneTokens(prev);
      const c = next.colors[i];
      if (c) c.value = value;
      return next;
    });
  const setSpacing = (i: number, px: number) =>
    setTokens((prev) => {
      const next = cloneTokens(prev);
      const s = next.spacing[i];
      if (s) s.px = px;
      return next;
    });
  const setRadius = (i: number, px: number) =>
    setTokens((prev) => {
      const next = cloneTokens(prev);
      const r = next.radius[i];
      if (r) r.px = px;
      return next;
    });
  const setType = (
    i: number,
    patch: Partial<{ fontSize: number; lineHeight: number; weight: number }>,
  ) =>
    setTokens((prev) => {
      const next = cloneTokens(prev);
      const t = next.type[i];
      if (t) {
        if (patch.fontSize !== undefined) t.fontSize = patch.fontSize;
        if (patch.lineHeight !== undefined) t.lineHeight = patch.lineHeight;
        if (patch.weight !== undefined) t.weight = patch.weight;
      }
      return next;
    });

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('designTokenLab')}
      title="Design Token Lab"
      subtitle="Color · Spacing · Radius · Type · live preview"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            <span className="text-ink-2">Diff:</span>{' '}
            <span className="font-mono text-ink-1">{diff}</span> tokens changed
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => {
                setTokens(cloneTokens(INITIAL_TOKENS));
                toast('Reset to current tokens');
              }}
            >
              Reset
            </Button>
            <Button
              size="xs"
              tone="default"
              onClick={() => {
                void navigator.clipboard?.writeText(toCss(tokens));
                toast('CSS vars copied');
              }}
            >
              Copy CSS vars
            </Button>
            <Button size="xs" tone="accent" onClick={() => toast('Tokens applied (mock)')}>
              Apply
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-[320px_1fr_260px] divide-x divide-line">
        <TokenTree
          tokens={tokens}
          setColor={setColor}
          setSpacing={setSpacing}
          setRadius={setRadius}
          setType={setType}
        />
        <PreviewPane tokens={tokens} />
        <RightRail tokens={tokens} />
      </div>
    </OverlayPanel>
  );
}
