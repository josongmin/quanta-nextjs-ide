import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

const button = cva(
  [
    'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap',
    'rounded-md border text-sm tracking-tightish',
    // Springy press + tonal cross-fade.
    'transition-[transform,background-color,border-color,color,box-shadow]',
    'duration-moderate ease-spring-soft',
    'active:scale-[0.97] active:duration-instant',
    'mi-focus-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      tone: {
        default:
          'bg-bg border-line text-ink-1 hover:bg-bg-hover hover:border-line-strong',
        ghost:
          'bg-transparent border-transparent text-ink-2 hover:bg-bg-hover hover:text-ink-1',
        accent:
          'bg-accent border-accent text-white hover:brightness-110 hover:shadow-glow-accent',
        soft:
          'bg-bg-subtle border-line text-ink-1 hover:bg-bg-hover hover:border-line-strong',
        warn:
          'bg-bg border-sev-warn/30 text-sev-warn hover:bg-sev-warn-soft hover:border-sev-warn/50',
        err:
          'bg-bg border-sev-err/30 text-sev-err hover:bg-sev-err-soft hover:border-sev-err/50',
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
