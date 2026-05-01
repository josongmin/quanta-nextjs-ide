import { toast } from 'sonner';
import { Button } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { ENVS, type HttpEnv } from '../helpers';

interface EnvToolbarProps {
  envId: HttpEnv['id'];
  onChange: (id: HttpEnv['id']) => void;
}

export function EnvToolbar({ envId, onChange }: EnvToolbarProps): JSX.Element {
  return (
    <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
      <span className="text-[10px] uppercase tracking-caps text-ink-3">env</span>
      {ENVS.map((e) => (
        <ToggleChip
          key={e.id}
          active={envId === e.id}
          onClick={() => onChange(e.id)}
        >
          {e.name}
        </ToggleChip>
      ))}
      <span className="ml-auto">
        <Button
          size="xs"
          tone="default"
          onClick={() => toast('New scratch request created (mock)')}
        >
          + New request
        </Button>
      </span>
    </div>
  );
}
