import { Popover, PopoverContent, PopoverTrigger, Kbd } from '@shared/ui';
import { globalKeybindings } from '@features/keybindings';
import { Keyboard } from 'lucide-react';

/**
 * Tiny floating button in the bottom-right that, when clicked, opens a
 * popover listing all global keybindings. Mounted from the palette feature
 * so we don't reach into other widgets.
 */
export function KeybindingsHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show keybindings"
          className="fixed bottom-3 right-3 z-30 inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-bg text-ink-2 hover:bg-bg-hover hover:text-ink-1 shadow-pop"
        >
          <Keyboard className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-[300px] p-0">
        <header className="px-3 py-2 hairline-b">
          <div className="text-caps text-ink-3">Keybindings</div>
        </header>
        <ul className="max-h-[60vh] overflow-y-auto py-1">
          {globalKeybindings.map((kb) => (
            <li
              key={kb.id}
              className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs"
            >
              <span className="text-ink-2 truncate">{kb.description}</span>
              <span className="shrink-0 font-mono text-[10px]">
                <Kbd>{kb.combo}</Kbd>
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
