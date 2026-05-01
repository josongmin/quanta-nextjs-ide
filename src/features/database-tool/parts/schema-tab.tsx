import { Chip, CodeBlock } from '@shared/ui';
import { SCHEMA_DIFF, diffKindTone, diffSign } from '../helpers';

export function SchemaTab(): JSX.Element {
  return (
    <div className="p-3">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="text-ink-2">version</span>
        <Chip tone="muted" size="xs">
          A · v0.7
        </Chip>
        <span className="text-ink-3">→</span>
        <Chip tone="accent" size="xs">
          B · v0.8
        </Chip>
        <span className="ml-auto text-ink-3">
          {SCHEMA_DIFF.length} changes
        </span>
      </div>
      <ul className="space-y-2">
        {SCHEMA_DIFF.map((e, i) => (
          <li
            key={i}
            className="rounded-sm border border-line bg-bg p-2"
          >
            <div className="mb-1 flex items-center gap-1.5 text-xs">
              <Chip tone={diffKindTone(e.kind)} size="xs">
                {diffSign(e.kind)} {e.kind}
              </Chip>
              <span className="font-mono text-ink-1">{e.table}</span>
              <span className="text-ink-3">·</span>
              <span className="font-mono text-ink-1">{e.column}</span>
              {e.note ? (
                <span className="ml-auto text-[11px] text-ink-3">
                  {e.note}
                </span>
              ) : null}
            </div>
            {e.kind === 'changed' ? (
              <div className="grid gap-1" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <CodeBlock
                  code={`${e.column} ${e.oldType ?? ''}`}
                  language="sql"
                  diff="before"
                  maxHeight={40}
                  showLineNumbers={false}
                />
                <CodeBlock
                  code={`${e.column} ${e.newType ?? ''}`}
                  language="sql"
                  diff="after"
                  maxHeight={40}
                  showLineNumbers={false}
                />
              </div>
            ) : (
              <CodeBlock
                code={`${e.column} ${e.kind === 'added' ? e.newType ?? '' : e.oldType ?? ''}`}
                language="sql"
                diff={e.kind === 'added' ? 'after' : 'before'}
                maxHeight={40}
                showLineNumbers={false}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
