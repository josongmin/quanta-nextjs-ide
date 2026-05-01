import { toast } from 'sonner';
import { Button, CodeBlock } from '@shared/ui';
import {
  KIND_LABEL,
  formatBytes,
  type RecordView,
  type StoreKind,
} from '../helpers';

interface RecordRailProps {
  selRecord: RecordView | null;
  counts: Record<StoreKind, number>;
  bytes: Record<StoreKind, number>;
}

export function RecordRail({ selRecord, counts, bytes }: RecordRailProps) {
  return (
    <aside className="overflow-y-auto p-3">
      <div className="text-[10px] uppercase tracking-caps text-ink-3">Record</div>
      {selRecord ? (
        <div className="mt-1 space-y-2">
          <div className="rounded-sm border border-line bg-bg p-2 font-mono text-[11px] text-ink-1 break-all">
            {selRecord.title}
          </div>
          <CodeBlock
            code={selRecord.json}
            language="json"
            showLineNumbers={false}
            maxHeight={220}
          />
          <ul className="divide-y divide-line rounded-sm border border-line bg-bg">
            {selRecord.meta.map((m) => (
              <li
                key={m.k}
                className="flex items-center justify-between px-2 py-1 text-[11px]"
              >
                <span className="font-mono text-ink-3">{m.k}</span>
                <span className="font-mono text-ink-1">{m.v}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-1">
            <Button size="xs" tone="ghost" onClick={() => toast('Edit (mock)')}>
              Edit
            </Button>
            <Button size="xs" tone="ghost" onClick={() => toast('Deleted (mock)')}>
              Delete
            </Button>
            <Button size="xs" tone="ghost" onClick={() => toast('Exported')}>
              Export
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-1 text-[11px] text-ink-3">Click a row to inspect.</div>
      )}

      <div className="mt-4 text-[10px] uppercase tracking-caps text-ink-3">Per-type</div>
      <ul className="mt-1 divide-y divide-line rounded-sm border border-line bg-bg">
        {(Object.keys(KIND_LABEL) as StoreKind[]).map((k) => (
          <li
            key={k}
            className="flex items-center justify-between px-2 py-1 text-[11px]"
          >
            <span className="text-ink-2">{KIND_LABEL[k]}</span>
            <span className="font-mono text-ink-3">
              {counts[k]} · {formatBytes(bytes[k])}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
