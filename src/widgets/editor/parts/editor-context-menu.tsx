import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@shared/ui';

interface Props {
  children: ReactNode;
}

export function EditorContextMenu({ children }: Props) {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const fire = (label: string, hint?: string) => () =>
    toast(label, hint ? { description: hint } : undefined);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Understand</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Show route contract')}>
          Show route contract
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => openOverlay('evidenceTracer', {})}
        >
          Show why dynamic
          <ContextMenuShortcut>⌘⇧Y</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Explain this file')}>
          Explain this file
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => openOverlay('blastRadius', {})}
        >
          Show client blast for this symbol
          <ContextMenuShortcut>⌘⇧B</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuLabel>Navigate</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Go to route definition')}>
          Go to route definition
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Go to action implementation')}>
          Go to action implementation
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Find references in routes')}>
          Find references in routes
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Find references by cache tag')}>
          Find references by cache tag
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuLabel>Refactor</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Convert to Server Component')}>
          Convert to Server Component
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Convert to Client Component')}>
          Convert to Client Component
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Extract Client Island')}>
          Extract Client Island
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Move boundary down')}>
          Move boundary down
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Add cache policy')}>
          Add cache policy
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Wrap with team fetch helper')}>
          Wrap with team fetch helper
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuLabel>Policy</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Add to route contract')}>
          Add to route contract
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Mute rule on this line')}>
          Mute rule on this line
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuLabel>Standard</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Cut')}>
          Cut <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Copy')}>
          Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Paste')}>
          Paste <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
