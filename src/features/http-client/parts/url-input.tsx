import { useMemo } from 'react';
import { cn } from '@shared/lib/cn';
import { tokenizeUrl } from '../helpers';

interface UrlInputProps {
  url: string;
  onChange: (v: string) => void;
}

export function UrlInput({ url, onChange }: UrlInputProps): JSX.Element {
  const urlTokens = useMemo(() => tokenizeUrl(url), [url]);
  return (
    <div className="flex h-6 flex-1 items-center rounded-sm border border-line bg-bg px-1.5">
      <input
        type="text"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        className="absolute left-[-9999px] top-[-9999px] opacity-0"
        aria-hidden
        tabIndex={-1}
      />
      <div
        className="flex flex-1 items-center overflow-x-auto whitespace-nowrap font-mono text-[11px] text-ink-1"
        onClick={(e) => {
          const tgt = e.currentTarget
            .nextElementSibling as HTMLInputElement | null;
          tgt?.focus();
        }}
      >
        {urlTokens.map((t, i) => (
          <span
            key={i}
            className={cn(
              t.isVar && 'rounded-sm bg-accent-soft px-0.5 text-accent',
            )}
          >
            {t.text}
          </span>
        ))}
      </div>
      <input
        type="text"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        className="ml-1 w-32 bg-transparent text-[11px] text-ink-2 placeholder:text-ink-3 focus:outline-none"
        placeholder="edit url"
      />
    </div>
  );
}
