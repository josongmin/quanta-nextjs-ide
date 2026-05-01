import * as TabsP from '@radix-ui/react-tabs';
import { forwardRef } from 'react';
import { cn } from '@shared/lib/cn';

export const Tabs = TabsP.Root;

export const TabsList = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsP.List>
>(({ className, ...props }, ref) => (
  <TabsP.List
    ref={ref}
    className={cn(
      'flex h-9 items-center gap-0 hairline-b bg-bg-subtle px-1',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsP.Trigger>
>(({ className, ...props }, ref) => (
  <TabsP.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex h-9 items-center gap-1.5 px-2 text-sm text-ink-2 hover:text-ink-1',
      'data-[state=active]:text-ink-1 data-[state=active]:font-medium',
      'data-[state=active]:after:absolute data-[state=active]:after:inset-x-1.5 data-[state=active]:after:bottom-0 data-[state=active]:after:h-px data-[state=active]:after:bg-accent',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsP.Content>
>(({ className, ...props }, ref) => (
  <TabsP.Content
    ref={ref}
    className={cn('flex-1 outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
