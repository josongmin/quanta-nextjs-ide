import * as CM from '@radix-ui/react-context-menu';
import { forwardRef } from 'react';
import { cn } from '@shared/lib/cn';

export const ContextMenu = CM.Root;
export const ContextMenuTrigger = CM.Trigger;
export const ContextMenuGroup = CM.Group;
export const ContextMenuPortal = CM.Portal;
export const ContextMenuSub = CM.Sub;
export const ContextMenuRadioGroup = CM.RadioGroup;

export const ContextMenuContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CM.Content>
>(({ className, ...props }, ref) => (
  <CM.Portal>
    <CM.Content
      ref={ref}
      className={cn(
        'z-50 min-w-[220px] overflow-hidden rounded-md border border-line bg-bg p-1 shadow-pop',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        'data-[state=open]:zoom-in-[0.98] data-[state=closed]:zoom-out-[0.98]',
        'duration-100 ease-out',
        className,
      )}
      {...props}
    />
  </CM.Portal>
));
ContextMenuContent.displayName = 'ContextMenuContent';

export const ContextMenuItem = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CM.Item>
>(({ className, ...props }, ref) => (
  <CM.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1 text-sm text-ink-1 outline-none data-[highlighted]:bg-bg-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = 'ContextMenuItem';

export const ContextMenuSeparator = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CM.Separator>
>(({ className, ...props }, ref) => (
  <CM.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-line', className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = 'ContextMenuSeparator';

export const ContextMenuLabel = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CM.Label>
>(({ className, ...props }, ref) => (
  <CM.Label
    ref={ref}
    className={cn('px-2 py-1 text-caps text-ink-3', className)}
    {...props}
  />
));
ContextMenuLabel.displayName = 'ContextMenuLabel';

export const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'ml-auto font-mono text-[10px] tracking-wide text-ink-3',
      className,
    )}
    {...props}
  />
);
ContextMenuShortcut.displayName = 'ContextMenuShortcut';
