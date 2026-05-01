import { cn } from '@shared/lib/cn';
import type { Confidence } from '@shared/types';

const sizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

interface Props {
  confidence: Confidence;
  size?: keyof typeof sizes;
  className?: string;
}

export function ConfidenceDot({ confidence, size = 'sm', className }: Props) {
  const ariaLabel = `confidence ${confidence}`;
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'inline-block shrink-0 rounded-full',
        sizes[size],
        confidence === 'high' && 'bg-current',
        confidence === 'medium' &&
          'bg-current opacity-60',
        confidence === 'low' &&
          'border border-current bg-transparent',
        className,
      )}
    />
  );
}
