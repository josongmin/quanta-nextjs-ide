import { Button, Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { ShippingStatus } from '../types';

interface Props {
  shipping: ShippingStatus;
  onShipNow(): void;
  className?: string;
}

const verdictTone = (v: ShippingStatus['verdict']) => {
  switch (v) {
    case 'admit':
      return 'static' as const;
    case 'inconclusive':
      return 'warn' as const;
    case 'reject':
      return 'err' as const;
    case 'unknown':
      return 'muted' as const;
  }
};

export function ShippingSection({ shipping, onShipNow, className }: Props) {
  const isAdmit = shipping.verdict === 'admit';
  return (
    <div className={cn('flex min-h-0 flex-col gap-1.5', className)}>
      <div className="text-caps text-[10px] uppercase tracking-wide text-ink-3">
        Shipping
      </div>
      <div className="flex items-center gap-1.5">
        <Chip
          tone={verdictTone(shipping.verdict)}
          size="xs"
          className={cn(isAdmit && 'gradient-accent text-white')}
        >
          {shipping.verdictLabel}
        </Chip>
        {shipping.pending ? (
          <span className="text-[11px] text-ink-3">{shipping.pending} pending</span>
        ) : null}
        <Button
          size="xs"
          tone="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onShipNow();
          }}
          className="ml-auto"
        >
          ship now
        </Button>
      </div>
      <div className="text-[10px] text-ink-3">
        {shipping.lastShippedAt
          ? `last ${shipping.lastShippedAt}${shipping.lastShippedBy ? ` · ${shipping.lastShippedBy}` : ''}`
          : 'never shipped'}
      </div>
    </div>
  );
}
