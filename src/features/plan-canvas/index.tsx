import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import {
  PLAN_NODES,
  toDraft,
  totalEtaMin,
  type NodeDraft,
} from './helpers';
import { CanvasSvg } from './parts/canvas-svg';
import { NodeEditor } from './parts/node-editor';

export function PlanCanvasOverlay() {
  const open = useUiStore((s) => s.overlays.planCanvas.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [selectedId, setSelectedId] = useState<string>(PLAN_NODES[0]?.id ?? '');
  const [draft, setDraft] = useState<NodeDraft>(() =>
    PLAN_NODES[0]
      ? toDraft(PLAN_NODES[0])
      : {
          title: '',
          kind: 'research',
          status: 'todo',
          etaMin: 0,
          notes: '',
          depsIds: [],
        },
  );

  const selected = useMemo(
    () => PLAN_NODES.find((n) => n.id === selectedId) ?? null,
    [selectedId],
  );

  const totalEta = useMemo(() => totalEtaMin(PLAN_NODES), []);

  function selectNode(id: string) {
    setSelectedId(id);
    const n = PLAN_NODES.find((x) => x.id === id);
    if (n) setDraft(toDraft(n));
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('planCanvas'))}
      title="Plan Canvas"
      subtitle={`${PLAN_NODES.length} nodes · drag canvas to pan`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <Chip tone="muted" size="xs">
            total ETA {totalEta}m
          </Chip>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Plan run started (mock)')}
            >
              Run plan
            </Button>
            <Button
              size="xs"
              tone="soft"
              onClick={() => toast('Exported plan as Markdown (mock)')}
            >
              Export markdown
            </Button>
            <Button
              size="xs"
              tone="soft"
              onClick={() => toast('Added node (mock)')}
            >
              Add node
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('planCanvas')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <CanvasSvg selectedId={selectedId} onSelectNode={selectNode} />
        <NodeEditor selected={selected} draft={draft} onDraftChange={setDraft} />
      </div>
    </OverlayPanel>
  );
}
