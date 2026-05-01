import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

const button = cva(
  'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      tone: {
        default: 'bg-bg border-line text-ink-1 hover:bg-bg-hover',
        ghost: 'bg-transparent border-transparent text-ink-2 hover:bg-bg-hover hover:text-ink-1',
        accent: 'bg-accent border-accent text-white hover:bg-accent/90',
        soft: 'bg-bg-subtle border-line text-ink-1 hover:bg-bg-hover',
        warn: 'bg-bg border-sev-warn/30 text-sev-warn hover:bg-sev-warn-soft',
        err: 'bg-bg border-sev-err/30 text-sev-err hover:bg-sev-err-soft',
      },
      size: {
        xs: 'h-5 px-1.5 text-[11px]',
        sm: 'h-6 px-2 text-xs',
        md: 'h-7 px-2.5 text-sm',
        lg: 'h-8 px-3 text-md',
        icon: 'h-6 w-6 p-0',
      },
    },
    defaultVariants: {
      tone: 'default',
      size: 'sm',
    },
  },
);

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, tone, size, asChild, ...rest }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref as never}
        className={cn(button({ tone, size }), className)}
        {...rest}
      />
    );
  },
);
Button.displayName = 'Button';
