import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

interface Props {
  title: ReactNode;
  defaultOpen?: boolean;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
  dense?: boolean;
}

export function Section({
  title,
  defaultOpen = true,
  trailing,
  className,
  children,
  dense = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className={cn('hairline-b last:border-b-0', className)}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <Collapsible.Trigger asChild>
          <button className="group inline-flex items-center gap-1.5 text-sm text-ink-1 hover:text-accent">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-ink-3 group-hover:text-accent" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-ink-3 group-hover:text-accent" />
            )}
            <span className="font-medium">{title}</span>
          </button>
        </Collapsible.Trigger>
        {trailing ? (
          <div className="flex items-center gap-1">{trailing}</div>
        ) : null}
      </div>
      <Collapsible.Content asChild>
        <div className={cn('px-3 pb-3', dense && 'pb-2')}>{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
