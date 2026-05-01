import { type HttpHeader } from '../helpers';

interface HeadersEditorProps {
  headers: ReadonlyArray<HttpHeader>;
  onSet: (idx: number, patch: Partial<HttpHeader>) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export function HeadersEditor({
  headers,
  onSet,
  onAdd,
  onRemove,
}: HeadersEditorProps): JSX.Element {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-caps text-ink-3">
        <span>headers</span>
        <button
          onClick={onAdd}
          className="font-medium text-ink-2 hover:text-ink-1"
        >
          + add
        </button>
      </div>
      <div className="grid gap-1 rounded-sm border border-line bg-bg p-2">
        {headers.length === 0 ? (
          <span className="text-[11px] text-ink-3">no headers</span>
        ) : (
          headers.map((h, i) => (
            <div
              key={i}
              className="grid items-center gap-1"
              style={{ gridTemplateColumns: '1fr 1.5fr 18px' }}
            >
              <input
                value={h.key}
                onChange={(e) => onSet(i, { key: e.target.value })}
                placeholder="Header"
                className="h-5 rounded-sm border border-line bg-bg px-1 text-[11px] focus:outline-none"
              />
              <input
                value={h.value}
                onChange={(e) => onSet(i, { value: e.target.value })}
                placeholder="value"
                className="h-5 rounded-sm border border-line bg-bg px-1 font-mono text-[11px] focus:outline-none"
              />
              <button
                onClick={() => onRemove(i)}
                className="text-ink-3 hover:text-sev-err"
                aria-label="remove header"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
