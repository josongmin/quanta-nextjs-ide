import { cn } from '@shared/lib/cn';

interface Props {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  diff?: 'before' | 'after';
  maxHeight?: number | string;
  className?: string;
}

export function CodeBlock({
  code,
  language,
  showLineNumbers = true,
  diff,
  maxHeight = 360,
  className,
}: Props) {
  const lines = code.length === 0 ? [''] : code.split('\n');
  const prefix = diff === 'before' ? '-' : diff === 'after' ? '+' : '';
  const lineToneCls =
    diff === 'before'
      ? 'text-sev-err'
      : diff === 'after'
        ? 'text-sem-static'
        : 'text-ink-1';
  const bgCls =
    diff === 'before'
      ? 'bg-sev-err-soft/40'
      : diff === 'after'
        ? 'bg-bg-subtle'
        : 'bg-bg';

  const styleHeight =
    typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm border border-line',
        bgCls,
        className,
      )}
    >
      {language ? (
        <span
          className={cn(
            'absolute right-1.5 top-1.5 z-10 inline-flex h-4 select-none items-center rounded-sm border border-line bg-bg px-1 font-mono text-[10px] font-medium tracking-caps text-ink-3',
          )}
          aria-hidden
        >
          {language}
        </span>
      ) : null}
      <pre
        className={cn('overflow-auto font-mono text-[11px] leading-[16px]')}
        style={{ maxHeight: styleHeight }}
      >
        <code className="block">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                'flex min-h-[16px] items-start whitespace-pre',
                lineToneCls,
              )}
            >
              {showLineNumbers ? (
                <span
                  aria-hidden
                  className="sticky left-0 inline-block w-9 select-none border-r border-line bg-bg-subtle px-1.5 text-right text-ink-3"
                >
                  {idx + 1}
                </span>
              ) : null}
              <span className="px-2">
                {prefix ? (
                  <span className="select-none text-ink-3">{prefix} </span>
                ) : null}
                {line || ' '}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
