import { toast } from 'sonner';
import {
  Button,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/ui';
import {
  NODE_KINDS,
  NODE_STATUSES,
  PLAN_NODES,
  statusTone,
  toDraft,
  type NodeDraft,
  type NodeKind,
  type NodeStatus,
  type PlanNode,
} from '../helpers';

interface NodeEditorProps {
  selected: PlanNode | null;
  draft: NodeDraft;
  onDraftChange: (next: NodeDraft) => void;
}

export function NodeEditor({
  selected,
  draft,
  onDraftChange,
}: NodeEditorProps): JSX.Element {
  if (!selected) {
    return (
      <aside className="min-w-0 px-3 py-3">
        <div className="text-[11px] text-ink-3">Select a node to edit.</div>
      </aside>
    );
  }
  const update = (patch: Partial<NodeDraft>) =>
    onDraftChange({ ...draft, ...patch });

  return (
    <aside className="min-w-0 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-caps text-ink-3">Node</h3>
        <Chip tone={statusTone(draft.status)} size="xs">
          {draft.status}
        </Chip>
      </div>

      <label className="mt-2 block">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          title
        </span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          className="mt-0.5 h-7 w-full rounded-sm border border-line bg-bg px-2 text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="mt-2 block">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          kind
        </span>
        <select
          value={draft.kind}
          onChange={(e) => update({ kind: e.target.value as NodeKind })}
          className="mt-0.5 h-7 w-full rounded-sm border border-line bg-bg px-2 text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {NODE_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-2">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          deps
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="mt-0.5 flex h-7 w-full items-center justify-between rounded-sm border border-line bg-bg px-2 text-xs text-ink-1"
            >
              <span className="truncate">
                {draft.depsIds.length === 0 ? 'none' : draft.depsIds.join(', ')}
              </span>
              <span className="text-ink-3">▾</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1">
            <ul className="max-h-48 overflow-y-auto">
              {PLAN_NODES.filter((n) => n.id !== selected.id).map((n) => {
                const checked = draft.depsIds.includes(n.id);
                return (
                  <li key={n.id}>
                    <label className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-bg-hover">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          update({
                            depsIds: checked
                              ? draft.depsIds.filter((x) => x !== n.id)
                              : [...draft.depsIds, n.id],
                          })
                        }
                      />
                      <span className="font-mono text-[10px] text-ink-3">
                        {n.id}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-ink-1">
                        {n.title}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <label className="mt-2 block">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          eta (min)
        </span>
        <input
          type="number"
          min={0}
          value={draft.etaMin}
          onChange={(e) =>
            update({ etaMin: Math.max(0, Number(e.target.value) || 0) })
          }
          className="mt-0.5 h-7 w-full rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="mt-2 block">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          notes
        </span>
        <textarea
          rows={3}
          value={draft.notes}
          onChange={(e) => update({ notes: e.target.value })}
          className="mt-0.5 w-full rounded-sm border border-line bg-bg px-2 py-1 text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="mt-2 block">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          status
        </span>
        <select
          value={draft.status}
          onChange={(e) => update({ status: e.target.value as NodeStatus })}
          className="mt-0.5 h-7 w-full rounded-sm border border-line bg-bg px-2 text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {NODE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="xs"
          tone="default"
          onClick={() => toast.success('Saved (mock)')}
        >
          Save
        </Button>
        <Button
          size="xs"
          tone="ghost"
          onClick={() => onDraftChange(toDraft(selected))}
        >
          Reset
        </Button>
      </div>
    </aside>
  );
}
