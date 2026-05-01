import { Chip } from '@shared/ui';
import type { FileStatus } from '../helpers';

interface FileStatusBadgeProps {
  status: FileStatus;
  className?: string;
}

export function FileStatusBadge({ status, className }: FileStatusBadgeProps) {
  if (status === 'done') {
    return (
      <Chip tone="static" size="xs" className={className}>
        done
      </Chip>
    );
  }
  if (status === 'streaming') {
    return (
      <Chip tone="accent" size="xs" className={className}>
        streaming…
      </Chip>
    );
  }
  return (
    <Chip tone="muted" size="xs" className={className}>
      pending
    </Chip>
  );
}
