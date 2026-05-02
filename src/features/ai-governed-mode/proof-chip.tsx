/**
 * Tiny pill that renders an obligation/proof status with an icon. Used
 * inside stages and the obligation checklist.
 */

import { Check, X, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@shared/lib/cn';

export type ProofChipStatus = 'pass' | 'fail' | 'unknown' | 'pending';

interface Props {
  status: ProofChipStatus;
  label: string;
  title?: string;
}

const STATUS_CLASS: Record<ProofChipStatus, string> = {
  pass: 'bg-sev-info-soft/40 text-sev-info border-sev-info/30',
  fail: 'bg-sev-err-soft/40 text-sev-err border-sev-err/40',
  unknown: 'bg-sev-warn-soft/40 text-sev-warn border-sev-warn/40',
  pending: 'bg-bg-subtle text-ink-3 border-line/60',
};

export function ProofChip({ status, label, title }: Props): JSX.Element {
  const Icon =
    status === 'pass'
      ? Check
      : status === 'fail'
        ? X
        : status === 'pending'
          ? Loader2
          : HelpCircle;
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium',
        'transition-[background-color,color,border-color] duration-moderate',
        STATUS_CLASS[status],
      )}
    >
      <Icon
        className={cn(
          'h-3 w-3',
          status === 'pending' ? 'animate-spin' : '',
        )}
      />
      {label}
    </span>
  );
}

export default ProofChip;
