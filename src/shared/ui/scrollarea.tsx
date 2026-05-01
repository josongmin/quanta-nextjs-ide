import * as SA from '@radix-ui/react-scroll-area';
import { forwardRef } from 'react';
import { cn } from '@shared/lib/cn';

export const ScrollArea = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SA.Root>
>(({ className, children, ...props }, ref) => (
  <SA.Root
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    type="scroll"
    scrollHideDelay={600}
    {...props}
  >
    <SA.Viewport className="h-full w-full rounded-[inherit]">{children}</SA.Viewport>
    <SA.Scrollbar
      orientation="vertical"
      className="flex h-full w-1.5 touch-none select-none transition-opacity duration-200 data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100 hover:w-2"
    >
      <SA.Thumb className="relative flex-1 rounded-full bg-line/60 transition-colors hover:bg-line-strong" />
    </SA.Scrollbar>
    <SA.Scrollbar
      orientation="horizontal"
      className="flex h-1.5 w-full touch-none select-none transition-opacity duration-200 data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100 hover:h-2"
    >
      <SA.Thumb className="relative flex-1 rounded-full bg-line/60 transition-colors hover:bg-line-strong" />
    </SA.Scrollbar>
    <SA.Corner />
  </SA.Root>
));
ScrollArea.displayName = 'ScrollArea';
