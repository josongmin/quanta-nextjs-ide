import { Fragment, useState } from 'react';

interface EnvVarsPanelProps {
  envName: string;
  vars: Record<string, string>;
  onSetVar: (k: string, v: string) => void;
  onRemoveVar: (k: string) => void;
}

export function EnvVarsPanel({
  envName,
  vars,
  onSetVar,
  onRemoveVar,
}: EnvVarsPanelProps): JSX.Element {
  const [newVarKey, setNewVarKey] = useState<string>('');
  const [newVarVal, setNewVarVal] = useState<string>('');
  return (
    <>
      <div className="flex h-7 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3 hairline-b hairline-t bg-bg-subtle">
        env vars · {envName}
      </div>
      <div className="space-y-1 p-2">
        {Object.entries(vars).map(([k, v]) => (
          <Fragment key={k}>
            <div
              className="grid items-center gap-1"
              style={{ gridTemplateColumns: '1fr 1.4fr 18px' }}
            >
              <input
                value={k}
                readOnly
                className="h-5 rounded-sm border border-line bg-bg-subtle px-1 font-mono text-[10px] text-ink-2 focus:outline-none"
              />
              <input
                value={v}
                onChange={(e) => onSetVar(k, e.target.value)}
                className="h-5 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] text-ink-1 focus:outline-none"
              />
              <button
                onClick={() => onRemoveVar(k)}
                className="text-ink-3 hover:text-sev-err"
                aria-label="remove var"
              >
                ×
              </button>
            </div>
          </Fragment>
        ))}
        <div
          className="grid items-center gap-1 pt-1"
          style={{ gridTemplateColumns: '1fr 1.4fr 18px' }}
        >
          <input
            value={newVarKey}
            onChange={(e) => setNewVarKey(e.target.value)}
            placeholder="KEY"
            className="h-5 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] focus:outline-none"
          />
          <input
            value={newVarVal}
            onChange={(e) => setNewVarVal(e.target.value)}
            placeholder="value"
            className="h-5 rounded-sm border border-line bg-bg px-1 font-mono text-[10px] focus:outline-none"
          />
          <button
            onClick={() => {
              if (!newVarKey) return;
              onSetVar(newVarKey, newVarVal);
              setNewVarKey('');
              setNewVarVal('');
            }}
            className="text-ink-3 hover:text-accent"
            aria-label="add var"
          >
            +
          </button>
        </div>
      </div>
    </>
  );
}
