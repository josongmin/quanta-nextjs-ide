import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

const chip = cva(
  'inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-xs font-medium tracking-caps select-none whitespace-nowrap transition-[background-color,border-color,color,transform] duration-moderate ease-spring-soft',
  {
    variants: {
      tone: {
        neutral: 'bg-bg border-line/80 text-ink-2',
        muted: 'bg-bg-subtle border-line/60 text-ink-3',
        accent: 'bg-accent-soft border-transparent text-accent',
        err: 'bg-sev-err-soft border-transparent text-sev-err',
        warn: 'bg-sev-warn-soft border-transparent text-sev-warn',
        info: 'bg-sev-info-soft border-transparent text-sev-info',
        hint: 'bg-bg-subtle border-line/60 text-sev-hint',
        static: 'bg-sem-static-soft border-transparent text-sem-static',
        isr: 'bg-sem-isr-soft border-transparent text-sem-isr',
        dynamic: 'bg-sem-dynamic-soft border-transparent text-sem-dynamic',
        edge: 'bg-sem-edge-soft border-transparent text-sem-edge',
        client: 'bg-sem-client-soft border-transparent text-sem-client',
        server: 'bg-sem-server-soft border-transparent text-sem-server',
      },
      size: {
        xs: 'h-4 px-1 text-[10px]',
        sm: 'h-5 px-1.5 text-[11px]',
        md: 'h-6 px-2 text-xs',
      },
      shape: {
        default: '',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'sm',
      shape: 'default',
    },
  },
);

interface ChipProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chip> {
  asChild?: boolean;
}

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, tone, size, shape, ...rest }, ref) => (
    <span ref={ref} className={cn(chip({ tone, size, shape }), className)} {...rest} />
  ),
);
Chip.displayName = 'Chip';
