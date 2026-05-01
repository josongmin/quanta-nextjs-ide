import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel } from '@shared/ui';
import {
  FRAMES,
  ROOT_ID,
  TOTAL_MS,
  childrenOf,
  depthOf,
  descendantsOf,
  frameById,
  isDescendant,
  longestFrame,
  type FlameFrame,
  type FrameKind,
} from './helpers';
import { ROW_H } from './parts/styles';
import { FlameToolbar } from './parts/flame-toolbar';
import { FlameSvg } from './parts/flame-svg';
import { SelectedFramePanel } from './parts/selected-frame-panel';

export function FlameGraphOverlay() {
  const open = useUiStore((s) => s.overlays.flameGraph.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [focusId, setFocusId] = useState<string>(ROOT_ID);
  const [selectedId, setSelectedId] = useState<string>(ROOT_ID);
  const [activeKinds, setActiveKinds] = useState<ReadonlyArray<FrameKind>>([]);
  const [search, setSearch] = useState('');

  const focused = frameById(focusId) ?? frameById(ROOT_ID)!;
  const selected = frameById(selectedId) ?? focused;

  const focusedTotal = focused.totalMs;
  const focusedDepth = depthOf(focused.id);

  const visibleFrames = useMemo<ReadonlyArray<FlameFrame>>(() => {
    return descendantsOf(focused.id);
  }, [focused.id]);

  const matches = useMemo<Set<string>>(() => {
    const q = search.trim().toLowerCase();
    if (q.length === 0 && activeKinds.length === 0) return new Set();
    const set = new Set<string>();
    for (const f of FRAMES) {
      const matchKind =
        activeKinds.length === 0 || activeKinds.includes(f.kind);
      const matchName = q.length === 0 || f.name.toLowerCase().includes(q);
      if (matchKind && matchName) set.add(f.id);
    }
    return set;
  }, [search, activeKinds]);

  const focusedSubtree = useMemo<
    ReadonlyArray<{ frame: FlameFrame; x: number; w: number; depth: number }>
  >(() => {
    const layout: {
      frame: FlameFrame;
      x: number;
      w: number;
      depth: number;
    }[] = [];

    function place(frameId: string, startMs: number, depth: number): void {
      const node = frameById(frameId);
      if (!node) return;
      layout.push({ frame: node, x: startMs, w: node.totalMs, depth });
      let cursor = startMs + node.selfMs;
      const kids = [...childrenOf(frameId)].sort(
        (a, b) => b.totalMs - a.totalMs,
      );
      for (const k of kids) {
        place(k.id, cursor, depth + 1);
        cursor += k.totalMs;
      }
    }
    place(focused.id, 0, 0);
    return layout;
  }, [focused.id]);

  const maxDepth = focusedSubtree.reduce((m, n) => Math.max(m, n.depth), 0);
  const svgH = (maxDepth + 1) * ROW_H + 8;

  const longest = longestFrame();

  function pickFrame(id: string): void {
    setSelectedId(id);
  }
  function focusFrame(id: string): void {
    setFocusId(id);
    setSelectedId(id);
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('flameGraph')}
      title="Flame Graph"
      subtitle="CPU profile · 1.2s capture"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-ink-3">
            <span>
              <span className="text-ink-2">total CPU:</span>{' '}
              <span className="font-mono text-ink-1">
                {TOTAL_MS.toFixed(0)}ms
              </span>
            </span>
            <span>
              <span className="text-ink-2">longest frame:</span>{' '}
              <span className="font-mono text-ink-1">{longest.name}</span>{' '}
              <span className="font-mono text-ink-3">
                {longest.totalMs.toFixed(1)}ms
              </span>
            </span>
            <span>
              <span className="text-ink-2">frames:</span>{' '}
              <span className="font-mono text-ink-1">{FRAMES.length}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('flame.json exported (mock)')}
            >
              Export flame.json
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('flameGraph')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <FlameToolbar
        search={search}
        onSearchChange={setSearch}
        activeKinds={activeKinds}
        onToggleKind={(k) =>
          setActiveKinds((p) =>
            p.includes(k) ? p.filter((x) => x !== k) : [...p, k],
          )
        }
        focusId={focusId}
        focusedName={focused.name}
        onResetFocus={() => focusFrame(ROOT_ID)}
      />

      <div className="grid" style={{ gridTemplateColumns: '1fr 320px' }}>
        <div className="hairline-r p-3">
          <div className="overflow-hidden rounded-sm border border-line bg-bg">
            <div className="flex h-7 items-center justify-between hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
              <span>flame · width = totalMs · click to select · double-click to zoom</span>
              <span className="font-mono text-ink-2">
                {focusedTotal.toFixed(1)}ms
              </span>
            </div>
            <div className="p-2">
              <FlameSvg
                focusedSubtree={focusedSubtree}
                focusedTotal={focusedTotal}
                svgH={svgH}
                selectedId={selectedId}
                matches={matches}
                onPick={pickFrame}
                onZoom={focusFrame}
              />
            </div>
            <div className="flex items-center gap-3 hairline-t bg-bg-subtle px-2 py-1 text-[10px] text-ink-3">
              <span>depth at focus: {focusedDepth}</span>
              <span>visible frames: {visibleFrames.length}</span>
              <span className="ml-auto italic">
                double-click rect to zoom
              </span>
            </div>
          </div>
        </div>

        <aside className="p-3">
          <SelectedFramePanel selected={selected} onPick={pickFrame} />

          {focusId !== ROOT_ID && !isDescendant(selected.id, focused.id) ? (
            <div className="mt-2 rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-1.5 text-[10px] text-ink-3">
              Selection lies outside current focus.
            </div>
          ) : null}
        </aside>
      </div>
    </OverlayPanel>
  );
}
