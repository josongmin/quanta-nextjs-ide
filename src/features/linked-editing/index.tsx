import { Icon } from '@shared/ui';

interface LinkedEditingHintProps {
  tag: string;
}

/**
 * Tiny floating chip rendered next to the cursor's tag to communicate that
 * the opening and closing tag are linked. Used by linked-editing-layer.
 */
export function LinkedEditingHint({ tag }: LinkedEditingHintProps) {
  return (
    <span
      className="pointer-events-none inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-1.5 py-0 text-[10px] font-medium tracking-caps text-accent"
      style={{ height: 16 }}
    >
      <Icon.Link className="h-2.5 w-2.5" />
      <span>linked</span>
      <span className="font-mono">&lt;{tag}/&gt;</span>
    </span>
  );
}
