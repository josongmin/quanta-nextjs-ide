import { cn } from '@shared/lib/cn';
import { SQL_KEYWORDS } from '../helpers';

interface SqlToken {
  text: string;
  isKw: boolean;
}

function tokenizeSql(sql: string): ReadonlyArray<SqlToken> {
  const out: SqlToken[] = [];
  const re = /([A-Za-z_]+)|([^A-Za-z_]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    const t = m[0];
    const isKw = /^[A-Za-z_]+$/.test(t) && SQL_KEYWORDS.has(t.toUpperCase());
    out.push({ text: t, isKw });
  }
  return out;
}

export function SqlBlock({ sql }: { sql: string }): JSX.Element {
  const lines = sql.split('\n');
  return (
    <div className="overflow-hidden rounded-sm border border-line bg-bg">
      <pre className="overflow-auto px-2 py-1 font-mono text-[11px] leading-[16px]">
        <code className="block">
          {lines.map((line, idx) => {
            const tokens = tokenizeSql(line);
            return (
              <div key={idx} className="flex min-h-[16px] items-start whitespace-pre">
                <span className="select-none pr-2 text-right text-ink-3" style={{ width: 22 }}>
                  {idx + 1}
                </span>
                <span>
                  {tokens.map((t, i) => (
                    <span
                      key={i}
                      className={cn(
                        t.isKw ? 'font-semibold text-accent' : 'text-ink-1',
                      )}
                    >
                      {t.text}
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
