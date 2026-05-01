import * as TooltipP from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 200,
  className,
}: TooltipProps) {
  return (
    <TooltipP.Provider delayDuration={delay} skipDelayDuration={0}>
      <TooltipP.Root>
        <TooltipP.Trigger asChild>{children}</TooltipP.Trigger>
        <TooltipP.Portal>
          <TooltipP.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              'z-50 max-w-[320px] rounded-sm border border-line bg-bg px-2 py-1 text-xs text-ink-1 shadow-pop',
              'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
              'data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0',
              'duration-100 ease-out',
              className,
            )}
          >
            {content}
            <TooltipP.Arrow className="fill-bg" />
          </TooltipP.Content>
        </TooltipP.Portal>
      </TooltipP.Root>
    </TooltipP.Provider>
  );
}
