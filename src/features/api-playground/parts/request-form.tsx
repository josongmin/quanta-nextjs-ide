import { Button, Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { endpointLabel, type ApiEndpointDef } from '../helpers';
import { METHOD_TONE } from './helpers';

interface Header {
  k: string;
  v: string;
}

interface RequestFormProps {
  selected: ApiEndpointDef;
  paramValues: Record<string, string>;
  headers: Header[];
  authOn: boolean;
  onParamChange: (name: string, value: string) => void;
  onParamToggle: (name: string) => void;
  onAddHeader: () => void;
  onUpdateHeader: (i: number, key: 'k' | 'v', value: string) => void;
  onRemoveHeader: (i: number) => void;
  onToggleAuth: () => void;
  onSend: () => void;
}

export function RequestForm({
  selected,
  paramValues,
  headers,
  authOn,
  onParamChange,
  onParamToggle,
  onAddHeader,
  onUpdateHeader,
  onRemoveHeader,
  onToggleAuth,
  onSend,
}: RequestFormProps) {
  return (
    <div className="hairline-b bg-bg p-3">
      <div className="mb-2 flex items-center gap-2">
        <Chip tone={selected.method ? (METHOD_TONE[selected.method] ?? 'muted') : 'muted'} size="sm">
          {selected.method ?? selected.protocol}
        </Chip>
        <span className="font-mono text-sm text-ink-1">{endpointLabel(selected)}</span>
        <span className="ml-auto text-[11px] text-ink-3">{selected.description}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">params</div>
          <div className="space-y-1.5">
            {selected.params.length === 0 ? (
              <span className="text-[11px] text-ink-3">No parameters</span>
            ) : (
              selected.params.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-xs">
                  <label className="w-28 truncate font-mono text-ink-2">
                    {p.name}
                    {p.required ? <span className="text-sev-err"> *</span> : null}
                  </label>
                  {p.type === 'enum' && p.enumValues ? (
                    <select
                      value={paramValues[p.name] ?? ''}
                      onChange={(e) => onParamChange(p.name, e.target.value)}
                      className="h-6 flex-1 rounded-sm border border-line bg-bg px-1.5 text-xs"
                    >
                      <option value="">—</option>
                      {p.enumValues.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  ) : p.type === 'boolean' ? (
                    <button
                      onClick={() => onParamToggle(p.name)}
                      className={cn(
                        'h-6 w-12 rounded-full border border-line text-[10px]',
                        paramValues[p.name] === 'true'
                          ? 'bg-accent text-white'
                          : 'bg-bg text-ink-2',
                      )}
                    >
                      {paramValues[p.name] === 'true' ? 'true' : 'false'}
                    </button>
                  ) : (
                    <input
                      type={p.type === 'number' ? 'number' : 'text'}
                      value={paramValues[p.name] ?? ''}
                      onChange={(e) => onParamChange(p.name, e.target.value)}
                      className="h-6 flex-1 rounded-sm border border-line bg-bg px-1.5 text-xs"
                      placeholder={p.required ? 'required' : 'optional'}
                    />
                  )}
                  <span className="w-14 text-right font-mono text-[10px] text-ink-3">
                    {p.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-caps text-ink-3">headers</span>
            <button className="text-[10px] text-accent hover:underline" onClick={onAddHeader}>
              + add
            </button>
          </div>
          <div className="space-y-1">
            {headers.map((h, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <input
                  value={h.k}
                  onChange={(e) => onUpdateHeader(i, 'k', e.target.value)}
                  placeholder="key"
                  className="h-6 w-1/3 rounded-sm border border-line bg-bg px-1.5"
                />
                <input
                  value={h.v}
                  onChange={(e) => onUpdateHeader(i, 'v', e.target.value)}
                  placeholder="value"
                  className="h-6 flex-1 rounded-sm border border-line bg-bg px-1.5"
                />
                <button
                  onClick={() => onRemoveHeader(i)}
                  className="px-1 text-ink-3 hover:text-ink-1"
                  aria-label="Remove header"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-caps text-ink-3">auth</span>
            <button
              onClick={onToggleAuth}
              className={cn(
                'h-6 rounded-full border border-line px-2 text-[10px]',
                authOn ? 'bg-accent text-white' : 'bg-bg text-ink-2',
              )}
            >
              {authOn ? 'token (mock)' : 'none'}
            </button>
            <Button size="xs" tone="accent" className="ml-auto" onClick={onSend}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
