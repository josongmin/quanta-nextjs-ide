import { Button, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { INTENTS, type IntentId } from '../helpers';

interface PromptBarProps {
  prompt: string;
  onPromptChange(s: string): void;
  intentId: IntentId;
  onIntentChange(id: IntentId): void;
  streaming: boolean;
  onGenerate(): void;
}

export function PromptBar({
  prompt,
  onPromptChange,
  intentId,
  onIntentChange,
  streaming,
  onGenerate,
}: PromptBarProps) {
  return (
    <div className="hairline-b bg-bg-subtle px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon.Bulb className="h-3.5 w-3.5 text-accent" />
        <input
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe the route…"
          className="h-7 flex-1 rounded-sm border border-line bg-bg px-2 text-xs text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
        />
        <Button size="sm" onClick={onGenerate} disabled={streaming}>
          {streaming ? 'Generating…' : 'Generate'}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="text-caps text-ink-3">Intents</span>
        {INTENTS.map((i) => (
          <button
            key={i.id}
            onClick={() => onIntentChange(i.id)}
            className={cn(
              'rounded-sm border px-1.5 py-0.5 text-[11px]',
              i.id === intentId
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {i.label}
          </button>
        ))}
      </div>
    </div>
  );
}
