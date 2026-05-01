import { Button, Icon } from '@shared/ui';

interface ResultPaneProps {
  resultText: string;
  onResultTextChange(s: string): void;
  onRegenerate(): void;
}

export function ResultPane({ resultText, onResultTextChange, onRegenerate }: ResultPaneProps) {
  return (
    <div className="flex min-w-0 flex-col p-2">
      <div className="flex items-center gap-2 rounded-t-sm border border-b-0 border-line bg-sem-static-soft px-2 py-1">
        <span className="text-caps text-sem-static">Result</span>
        <span className="ml-auto font-mono text-[10px] text-ink-3">
          {resultText.split('\n').length} lines
        </span>
      </div>
      <textarea
        value={resultText}
        onChange={(e) => onResultTextChange(e.target.value)}
        spellCheck={false}
        className="h-[52vh] w-full resize-none rounded-b-sm border border-line bg-bg p-2 font-mono text-[11px] leading-[16px] text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <div className="mt-1 flex items-center gap-1">
        <Button size="xs" tone="ghost" onClick={onRegenerate}>
          <Icon.Refresh className="h-3 w-3" /> Regenerate
        </Button>
      </div>
    </div>
  );
}
