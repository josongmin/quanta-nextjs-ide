import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';
import { Icon } from './icons';

interface LensLineProps {
  kind?: 'route' | 'function' | 'fetch' | 'client' | 'action' | 'fold';
  label?: string;
  children?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  onClick?(): void;
  indent?: number; // px, to match editor indentation
}

const kindLabels: Record<NonNullable<LensLineProps['kind']>, string> = {
  route: 'ROUTE',
  function: 'FN',
  fetch: 'FETCH',
  client: 'CLIENT',
  action: 'ACTION',
  fold: 'FOLD',
};

export function LensLine({
  kind = 'route',
  label,
  children,
  trailing,
  className,
  onClick,
  indent = 0,
}: LensLineProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      style={indent ? { paddingLeft: indent } : undefined}
      className={cn(
        'flex h-[26px] w-full items-center gap-2 px-2 py-0.5',
        'font-mono text-[11.5px] tracking-tightish text-ink-3',
        'transition-colors duration-moderate ease-swift-out',
        'hover:text-ink-2 hover:bg-bg-hover/40',
        'border-l-2 border-transparent hover:border-line',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <Icon.ChevDown className="h-3 w-3 shrink-0 text-ink-3/70" />
      <span className="text-caps text-ink-3 select-none">{kindLabels[kind]}</span>
      {label ? (
        <span className="truncate font-sans text-ink-1 tracking-tightish">{label}</span>
      ) : null}
      {children}
      {trailing ? (
        <span className="ml-auto flex shrink-0 items-center gap-1.5 pr-2">{trailing}</span>
      ) : null}
    </Comp>
  );
}
