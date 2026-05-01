import { fmtMs, type CellOutput } from '../helpers';

export function OutputView({ output }: { output: CellOutput }) {
  if (output.kind === 'error') {
    return (
      <div className="border border-sev-err/30 bg-sev-err-soft/40 px-3 py-2">
        <div className="text-caps mb-1 text-[10px] uppercase text-sev-err">
          Error · {fmtMs(output.durationMs)}
        </div>
        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-[16px] text-sev-err">
          {output.error ?? ''}
        </pre>
      </div>
    );
  }
  if (output.kind === 'text') {
    return (
      <div className="bg-bg-subtle px-3 py-2">
        <div className="text-caps mb-1 text-[10px] uppercase text-ink-3">
          stdout · {fmtMs(output.durationMs)}
        </div>
        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-[16px] text-ink-1">
          {output.text ?? ''}
        </pre>
      </div>
    );
  }
  if (output.kind === 'table' && output.table) {
    return (
      <div className="bg-bg-subtle px-3 py-2">
        <div className="text-caps mb-1 text-[10px] uppercase text-ink-3">
          dataframe · {output.table.rows.length} rows · {fmtMs(output.durationMs)}
        </div>
        <div className="overflow-x-auto rounded-sm border border-line bg-bg">
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="hairline-b text-left text-ink-3">
                {output.table.columns.map((c) => (
                  <th key={c} className="px-2 py-1 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {output.table.rows.map((r, ri) => (
                <tr key={ri} className="hover:bg-bg-hover">
                  {r.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1 text-ink-1">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return null;
}
