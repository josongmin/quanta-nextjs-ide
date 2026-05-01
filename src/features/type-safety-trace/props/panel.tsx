/**
 * Right-rail panel section that renders a PropOrigin chain.
 *
 * Visual contract:
 *   - vertical card stack with arrows between cards
 *   - each card shows kind badge, file:line, snippet, kind icon
 *   - 200ms staggered fade-in (Apple-style)
 *   - search box filters chain by file path
 */

import { useMemo, useState } from 'react';
import { Chip, SearchInput } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { useTypeSafetyStore } from '../store';
import type { PropChainStep, PropOrigin } from './types';

const KIND_TONE: Record<PropChainStep['kind'], 'info' | 'warn' | 'err' | 'muted'> = {
  literal: 'muted',
  'parent-prop': 'info',
  local: 'muted',
  hook: 'info',
  import: 'info',
  'server-data': 'warn',
  unknown: 'muted',
};

const KIND_LABEL: Record<PropChainStep['kind'], string> = {
  literal: 'literal',
  'parent-prop': 'parent prop',
  local: 'local',
  hook: 'hook',
  import: 'import',
  'server-data': 'server',
  unknown: 'unknown',
};

const RISK_TONE: Record<PropOrigin['serializationRisk'], 'info' | 'warn' | 'err'> = {
  safe: 'info',
  maybe: 'warn',
  unsafe: 'err',
};

interface PropsPanelProps {
  onJump?: (file: string, line: number, column: number) => void;
}

export function PropsOriginPanel({ onJump }: PropsPanelProps) {
  const origins = useTypeSafetyStore((s) => s.props.origins);
  const [filter, setFilter] = useState('');
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return origins;
    return origins.filter((o) =>
      [o.propName, o.consumer, o.jsxLocation.file, ...o.chain.map((c) => c.symbol.file)].some(
        (s) => s.toLowerCase().includes(q),
      ),
    );
  }, [origins, filter]);

  if (origins.length === 0) {
    return (
      <div className="p-6 text-center text-[12px] text-ink-3">
        Hover a JSX prop to trace its origin.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <SearchInput
        placeholder="Filter by file or prop"
        value={filter}
        onChange={setFilter}
      />
      {filtered.map((origin, idx) => (
        <PropOriginCard key={idx} origin={origin} onJump={onJump} />
      ))}
      {filtered.length === 0 ? (
        <div className="text-center text-[11px] text-ink-3">No matches.</div>
      ) : null}
    </div>
  );
}

function PropOriginCard({
  origin,
  onJump,
}: {
  origin: PropOrigin;
  onJump?: (file: string, line: number, column: number) => void;
}) {
  return (
    <div className="rounded-md border border-line bg-bg p-3 backdrop-blur-[2px] shadow-pop">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="font-mono text-ink-1">{origin.propName}</span>
          <span className="text-ink-3">on</span>
          <span className="font-mono text-ink-2">{origin.consumer}</span>
        </div>
        <Chip tone={RISK_TONE[origin.serializationRisk]} size="xs">
          {origin.serializationRisk}
        </Chip>
      </div>
      {origin.serializationReason ? (
        <div className="mt-1 text-[11px] text-ink-3">{origin.serializationReason}</div>
      ) : null}
      <ol className="mt-3 flex flex-col gap-2">
        {origin.chain.map((step, i) => (
          <li
            key={i}
            className={cn(
              'group rounded-sm border border-line bg-bg-subtle p-2',
              'transition-opacity duration-200',
              'animate-[qts-fade-in_200ms_ease-out_both]',
            )}
            style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}
          >
            <div className="flex items-center gap-2">
              <Chip tone={KIND_TONE[step.kind]} size="xs">
                {KIND_LABEL[step.kind]}
              </Chip>
              <button
                type="button"
                className="truncate text-[10.5px] font-mono text-ink-3 hover:text-ink-1"
                onClick={() =>
                  onJump?.(step.symbol.file, step.symbol.line, step.symbol.column)
                }
                title={`${step.symbol.file}:${step.symbol.line}`}
              >
                {step.symbol.file}:{step.symbol.line}
              </button>
            </div>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-[11px] font-mono text-ink-1">
              {step.snippet}
            </pre>
            {step.note ? (
              <div className="mt-1 text-[10.5px] text-ink-3">{step.note}</div>
            ) : null}
            {i < origin.chain.length - 1 ? (
              <div className="pointer-events-none -mb-1 mt-1 text-center text-[10px] text-ink-3">
                ↓
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
