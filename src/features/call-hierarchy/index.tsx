import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Chip,
  CodeBlock,
  EmptyState,
  Icon,
  OverlayPanel,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import {
  FNS,
  ROOT_ID,
  buildTree,
  findFn,
  type Direction,
  type TreeNode,
} from './helpers';

type DepthOption = '1' | '2' | '3' | 'all';

const DEPTH_TO_NUM: Record<DepthOption, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
  all: 99,
};

const DEPTH_OPTIONS: ReadonlyArray<{ value: DepthOption; label: string }> = [
  { value: '1', label: '1 level' },
  { value: '2', label: '2 levels' },
  { value: '3', label: '3 levels' },
  { value: 'all', label: 'All' },
];

export function CallHierarchyOverlay() {
  const open = useUiStore((s) => s.overlays.callHierarchy.open);
  const symbolId = useUiStore((s) => s.overlays.callHierarchy.symbolId);
  const close = useUiStore((s) => s.closeOverlay);

  const rootId = symbolId ?? ROOT_ID;
  const [direction, setDirection] = useState<Direction>('callees');
  const [depth, setDepth] = useState<DepthOption>('3');
  const [selected, setSelected] = useState<string>(rootId);

  const tree = useMemo(
    () => buildTree(rootId, direction, DEPTH_TO_NUM[depth]),
    [rootId, direction, depth],
  );

  const selectedFn = findFn(selected) ?? findFn(rootId);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('callHierarchy')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Net className="h-4 w-4 text-ink-3" />
          <span>Call Hierarchy</span>
          <Chip tone="accent" size="xs">
            {rootId}
          </Chip>
        </span>
      }
      size="lg"
      footer={
        <>
          <SelectControl
            label="Depth"
            value={depth}
            options={DEPTH_OPTIONS}
            onChange={(v) => setDepth(v)}
          />
          <button
            onClick={() =>
              toast('Find unused (mock)', {
                description: 'Scanned 18 fns; flagged 2 unreached.',
              })
            }
            className="ml-2 inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-bg px-2 text-[11px] text-ink-2 hover:bg-bg-hover"
          >
            <Icon.Filter className="h-3 w-3" /> Find unused
          </button>
          <span className="ml-auto text-[11px] text-ink-3">
            {FNS.length} fns indexed
          </span>
        </>
      }
    >
      <Tabs
        value={direction}
        onValueChange={(v) => setDirection(v as Direction)}
      >
        <TabsList>
          <TabsTrigger value="callers">
            <Icon.Up className="h-3 w-3" /> Callers
          </TabsTrigger>
          <TabsTrigger value="callees">
            <Icon.Down className="h-3 w-3" /> Callees
          </TabsTrigger>
        </TabsList>
        <TabsContent value="callers">
          <Body
            tree={tree}
            direction="callers"
            selected={selected}
            onSelect={setSelected}
            selectedFn={selectedFn}
          />
        </TabsContent>
        <TabsContent value="callees">
          <Body
            tree={tree}
            direction="callees"
            selected={selected}
            onSelect={setSelected}
            selectedFn={selectedFn}
          />
        </TabsContent>
      </Tabs>
    </OverlayPanel>
  );
}

function Body({
  tree,
  direction,
  selected,
  onSelect,
  selectedFn,
}: {
  tree: TreeNode | null;
  direction: Direction;
  selected: string;
  onSelect(id: string): void;
  selectedFn: ReturnType<typeof findFn>;
}) {
  return (
    <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
      <ScrollArea className="max-h-[60vh]">
        <div className="p-3">
          {tree === null ? (
            <EmptyState
              title="No tree to render"
              description="Pick a different symbol or direction."
              icon={<Icon.Net className="h-4 w-4" />}
            />
          ) : tree.children.length === 0 ? (
            <div className="p-3">
              <EmptyState
                title={
                  direction === 'callers' ? 'No callers' : 'No callees'
                }
                description={
                  direction === 'callers'
                    ? 'This function appears to be a top-level entry point.'
                    : 'This function does not call any tracked symbols.'
                }
                icon={<Icon.Net className="h-4 w-4" />}
              />
              <div className="mt-2">
                <NodeRow
                  node={tree}
                  depth={0}
                  selected={selected}
                  onSelect={onSelect}
                  defaultOpen
                />
              </div>
            </div>
          ) : (
            <ul>
              <NodeRow
                node={tree}
                depth={0}
                selected={selected}
                onSelect={onSelect}
                defaultOpen
              />
            </ul>
          )}
        </div>
      </ScrollArea>
      <aside className="min-w-0">
        <header className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
          <Icon.Info className="h-3 w-3 text-ink-3" />
          <span className="text-caps text-ink-3">Selected node</span>
        </header>
        {selectedFn ? (
          <div className="space-y-3 p-3">
            <div>
              <div className="font-mono text-[12px] text-ink-1">
                {selectedFn.name}
              </div>
              <div className="mt-1 truncate font-mono text-[11px] text-ink-3">
                {selectedFn.signature}
              </div>
              <div className="mt-1 font-mono text-[11px] text-ink-3">
                {selectedFn.file}:{selectedFn.line}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-sm border border-line bg-bg-subtle px-2 py-1">
                <div className="text-ink-3">Times called</div>
                <div className="font-mono text-ink-1">
                  {selectedFn.callCount}
                </div>
              </div>
              <div className="rounded-sm border border-line bg-bg-subtle px-2 py-1">
                <div className="text-ink-3">Returns</div>
                <div className="truncate font-mono text-ink-1">
                  {selectedFn.returnType}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-1 text-caps text-ink-3">Body preview</div>
              <CodeBlock
                code={selectedFn.preview}
                language="ts"
                maxHeight={200}
              />
            </div>
          </div>
        ) : (
          <div className="p-4 text-xs text-ink-3">No function selected.</div>
        )}
      </aside>
    </div>
  );
}

function NodeRow({
  node,
  depth,
  selected,
  onSelect,
  defaultOpen,
}: {
  node: TreeNode;
  depth: number;
  selected: string;
  onSelect(id: string): void;
  defaultOpen?: boolean;
}) {
  const [openNode, setOpenNode] = useState(defaultOpen ?? depth < 1);
  const hasChildren = node.children.length > 0;
  const isSelected = selected === node.id;
  return (
    <li>
      <div
        className={`flex items-center gap-1 rounded-sm ${isSelected ? 'bg-accent-soft' : 'hover:bg-bg-hover'}`}
        style={{ paddingLeft: 4 + depth * 16 }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpenNode((v) => !v)}
            className="flex h-5 w-4 items-center justify-center text-ink-3 hover:text-ink-1"
            aria-label={openNode ? 'Collapse' : 'Expand'}
          >
            {openNode ? (
              <Icon.ChevDown className="h-3 w-3" />
            ) : (
              <Icon.ChevRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="inline-block h-5 w-4" />
        )}
        <button
          onClick={() => onSelect(node.id)}
          className="flex flex-1 items-center gap-2 py-1 text-left"
        >
          <Icon.Code className="h-3 w-3 shrink-0 text-ink-3" />
          <span className="font-mono text-[12px] text-ink-1">
            {node.fn.name}
          </span>
          <span className="truncate font-mono text-[11px] text-ink-3">
            {node.fn.signature}
          </span>
          <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-3">
            {shortFile(node.fn.file)}:{node.fn.line}
          </span>
        </button>
      </div>
      {hasChildren && openNode ? (
        <ul>
          {node.children.map((c) => (
            <NodeRow
              key={`${node.id}-${c.id}-${depth}`}
              node={c}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function shortFile(file: string): string {
  const parts = file.split('/');
  return parts.slice(-2).join('/');
}
