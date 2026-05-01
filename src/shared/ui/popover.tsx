import * as PopoverP from '@radix-ui/react-popover';
import { forwardRef } from 'react';
import { cn } from '@shared/lib/cn';

export const Popover = PopoverP.Root;
export const PopoverTrigger = PopoverP.Trigger;
export const PopoverAnchor = PopoverP.Anchor;

export const PopoverContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverP.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <PopoverP.Portal>
    <PopoverP.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 rounded-md border border-line bg-bg shadow-pop outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        'data-[state=open]:zoom-in-[0.98] data-[state=closed]:zoom-out-[0.98]',
        'duration-150 ease-out',
        className,
      )}
      {...props}
    />
  </PopoverP.Portal>
));
PopoverContent.displayName = 'PopoverContent';
